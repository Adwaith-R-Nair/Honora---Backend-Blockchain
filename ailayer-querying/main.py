"""
Honora EMS – AI Layer
FastAPI microservice: semantic search over vectorised PDF evidence.
"""
from __future__ import annotations

import os
from contextlib import asynccontextmanager
from typing import Any

import httpx
import jwt
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from embeddings import embed_text
from preprocessing import extract_full
from search import semantic_search
from vector_store import ensure_collection, upsert_evidence
from cross_case import find_linked_cases

load_dotenv()

EMS_BACKEND_URL: str = os.getenv("EMS_BACKEND_URL", "http://localhost:3000")
JWT_SECRET: str = os.getenv("JWT_SECRET", "changeme")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.85"))



SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc"]


# ── Lifespan ──────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    ensure_collection()
    yield


app = FastAPI(title="Honora EMS – AI Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ── Auth helpers ───────────────────────────────────────────────────────────
def decode_token(credentials: HTTPAuthorizationCredentials) -> dict[str, Any]:
    try:
        return jwt.decode(
            credentials.credentials,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )


def get_rbac(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, Any]:
    payload = decode_token(credentials)
    return {
        "role": payload.get("role", "viewer"),
        "department": payload.get("department"),
        "allowed_case_ids": payload.get("allowed_case_ids", []),
        "userId": payload.get("sub"),
    }


# ── Shared helper: download and index a single file ───────────────────────
async def _index_single_file(
    point_id: str,
    ipfs_url: str,
    filename: str,
    payload: dict[str, Any],
    auth_headers: dict[str, str],
) -> dict[str, Any]:
    """Download a file from IPFS, embed it, and upsert into Qdrant."""
    if not ipfs_url:
        return {"status": "skipped", "reason": "no file URL", "id": point_id}
    if not any(filename.lower().endswith(ext) for ext in SUPPORTED_EXTENSIONS):
        return {"status": "skipped", "reason": "not a supported document type", "id": point_id}

    async with httpx.AsyncClient() as client:
        resp = await client.get(ipfs_url, headers=auth_headers, timeout=60)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Could not download file: {filename}")
        file_bytes = resp.content

    extraction = extract_full(file_bytes, filename=filename)
    vector = embed_text(extraction.combined)

    payload["tableCount"] = len(extraction.tables)
    payload["tableSummary"] = [
        {"page": t.page + 1, "headers": t.headers, "rowCount": len(t.rows)}
        for t in extraction.tables
    ]

    upsert_evidence(point_id, vector, payload)
    return {"status": "indexed", "pointId": point_id, "filename": filename}


# ── Schemas ────────────────────────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    metadata_filters: dict[str, Any] | None = None


class IndexRequest(BaseModel):
    evidenceId: str

class CrossCaseRequest(BaseModel):
    evidenceId: str
    top_k: int = 10

# ── Routes ────────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/index")
async def index_evidence(
    body: IndexRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    rbac: dict[str, Any] = Depends(get_rbac),
):
    """
    Fetch a police evidence file from the backend, embed and store in Qdrant.
    """
    evidence_id = body.evidenceId
    auth_headers = {"Authorization": f"Bearer {credentials.credentials}"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{EMS_BACKEND_URL}/api/evidence/{evidence_id}",
            headers=auth_headers,
            timeout=30,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Backend returned {resp.status_code}")
        evidence_data = resp.json().get("data", {})

    ipfs_url = evidence_data.get("ipfsUrl", "")
    filename = evidence_data.get("filename", "")

    payload = {
        "docType": "police_evidence",
        "caseId": evidence_data.get("caseId"),
        "caseName": evidence_data.get("caseName"),
        "evidenceName": filename,
        "uploadTimestamp": evidence_data.get("timestamp"),
        "department": evidence_data.get("department"),
        "uploader": evidence_data.get("uploadedBy"),
        "fileUrl": ipfs_url,
    }

    result = await _index_single_file(
        point_id=f"evidence-{evidence_id}",
        ipfs_url=ipfs_url,
        filename=filename,
        payload=payload,
        auth_headers=auth_headers,
    )
    result["evidenceId"] = evidence_id
    return result


@app.post("/api/index-supporting")
async def index_supporting_docs(
    body: IndexRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    rbac: dict[str, Any] = Depends(get_rbac),
):
    """
    Fetch all supporting docs linked to a police evidenceId,
    embed and store each one in Qdrant.
    """
    evidence_id = body.evidenceId
    auth_headers = {"Authorization": f"Bearer {credentials.credentials}"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{EMS_BACKEND_URL}/api/supporting-docs/{evidence_id}",
            headers=auth_headers,
            timeout=30,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Backend returned {resp.status_code}")
        docs: list[dict[str, Any]] = resp.json().get("data", [])

    if not docs:
        return {"status": "no_docs", "evidenceId": evidence_id, "indexed": []}

    # First fetch police evidence metadata to get caseId/caseName/department
    async with httpx.AsyncClient() as client:
        ev_resp = await client.get(
            f"{EMS_BACKEND_URL}/api/evidence/{evidence_id}",
            headers=auth_headers,
            timeout=30,
        )
        evidence_data = ev_resp.json().get("data", {}) if ev_resp.status_code == 200 else {}

    results = []
    for doc in docs:
        doc_id = doc.get("docId", "")
        filename = doc.get("filename", "")
        ipfs_url = doc.get("ipfsUrl", "")

        payload = {
            "docType": doc.get("docType", "supporting_doc"),
            "docId": doc_id,
            "linkedEvidenceId": evidence_id,
            "caseId": evidence_data.get("caseId") or doc.get("caseId"),
            "caseName": evidence_data.get("caseName"),
            "evidenceName": filename,
            "uploadTimestamp": doc.get("timestamp"),
            "department": evidence_data.get("department"),
            "uploader": doc.get("uploadedBy"),
            "fileUrl": ipfs_url,
        }

        result = await _index_single_file(
            point_id=f"supporting-{evidence_id}-{doc_id}",
            ipfs_url=ipfs_url,
            filename=filename,
            payload=payload,
            auth_headers=auth_headers,
        )
        results.append(result)

    indexed = [r for r in results if r["status"] == "indexed"]
    skipped = [r for r in results if r["status"] == "skipped"]

    return {
        "evidenceId": evidence_id,
        "indexed": indexed,
        "skipped": skipped,
        "totalIndexed": len(indexed),
        "totalSkipped": len(skipped),
    }


@app.post("/api/search")
async def search_evidence(
    body: SearchRequest,
    rbac: dict[str, Any] = Depends(get_rbac),
):
    results = semantic_search(
        query=body.query,
        rbac=rbac,
        top_k=body.top_k,
        metadata_filters=body.metadata_filters,
    )
    return {"results": results, "count": len(results)}

@app.post("/api/cross-case-linkage")
async def cross_case_linkage(
    body: CrossCaseRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    rbac: dict[str, Any] = Depends(get_rbac),
):
    """
    Find cases semantically similar to a given evidence item.
    Returns cases with similarity score above SIMILARITY_THRESHOLD (default 0.85).
    """
    evidence_id = body.evidenceId
    auth_headers = {"Authorization": f"Bearer {credentials.credentials}"}

    # Fetch the evidence metadata from backend
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{EMS_BACKEND_URL}/api/evidence/{evidence_id}",
            headers=auth_headers,
            timeout=30,
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Backend returned {resp.status_code}"
            )
        evidence_data = resp.json().get("data", {})

    # Fetch the actual file from IPFS to get its text
    ipfs_url = evidence_data.get("ipfsUrl", "")
    filename = evidence_data.get("filename", "")
    case_id = evidence_data.get("caseId", "")

    if not ipfs_url:
        raise HTTPException(status_code=404, detail="No IPFS URL for this evidence")

    if not any(filename.lower().endswith(ext) for ext in SUPPORTED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported for cross-case linkage: {filename}"
        )

    # Download and extract text
    async with httpx.AsyncClient() as client:
        file_resp = await client.get(ipfs_url, timeout=60)
        if file_resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Could not download file from IPFS")
        file_bytes = file_resp.content

    extraction = extract_full(file_bytes, filename=filename)
    query_text = extraction.combined

    # Find linked cases
    linked = find_linked_cases(
        query_text=query_text,
        source_case_id=str(case_id),
        source_evidence_id=str(evidence_id),
        top_k=body.top_k,
    )

    return {
        "sourceEvidenceId": evidence_id,
        "sourceCaseId":     case_id,
        "sourceCaseName":   evidence_data.get("caseName"),
        "department":       evidence_data.get("department"),
        "threshold":        SIMILARITY_THRESHOLD,
        "linkedCases":      linked,
        "totalLinked":      len(linked),
    }

# ── Entry point (python main.py) ──────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8000")), reload=True)
