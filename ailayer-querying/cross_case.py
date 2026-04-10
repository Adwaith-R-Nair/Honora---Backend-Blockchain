"""
Cross-Case Linkage for Honora EMS.
Finds cases that are semantically similar to a given evidence item.
Threshold: 0.85 cosine similarity (configurable via env).
"""
from __future__ import annotations

import os
from typing import Any

from dotenv import load_dotenv

from embeddings import embed_text
from vector_store import search_similar

load_dotenv()

SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.72"))
MAX_RESULTS = int(os.getenv("CROSS_CASE_MAX_RESULTS", "10"))


def find_linked_cases(
    query_text: str,
    source_case_id: str,
    source_evidence_id: str,
    top_k: int = MAX_RESULTS,
) -> list[dict[str, Any]]:
    """
    Find cases semantically similar to the given query text.
    Excludes the source case itself from results.
    Only returns results above SIMILARITY_THRESHOLD.
    """
    query_vector = embed_text(query_text)

    # Over-fetch to account for filtering
    raw_results = search_similar(
        query_vector=query_vector,
        top_k=top_k * 5,
        score_threshold=SIMILARITY_THRESHOLD,
    )

    linked: list[dict[str, Any]] = []
    seen_cases: set[str] = set()

    for hit in raw_results:
        payload = hit.payload or {}
        hit_case_id = str(payload.get("caseId", ""))
        hit_evidence_id = str(
            payload.get("linkedEvidenceId") or payload.get("evidence_id") or hit.id
        )

        # Exclude the source evidence itself
        if hit_evidence_id == str(source_evidence_id):
            continue

        # Exclude same case
        if hit_case_id == str(source_case_id):
            continue

        # Chunking stores multiple vectors per document — keep only the
        # highest-scoring chunk per case (results are sorted by score desc,
        # so first hit for each case_id is already the best match)
        if hit_case_id in seen_cases:
            continue
        seen_cases.add(hit_case_id)

        linked.append({
            "evidenceId":      hit_evidence_id,
            "caseId":          hit_case_id,
            "caseName":        payload.get("caseName"),
            "department":      payload.get("department"),
            "evidenceName":    payload.get("evidenceName"),
            "similarityScore": round(hit.score, 4),
            "docType":         payload.get("docType"),
            "fileUrl":         payload.get("fileUrl"),
            "uploader":        payload.get("uploader"),
            "uploadTimestamp": payload.get("uploadTimestamp"),
        })

        if len(linked) >= top_k:
            break

    # Sort by similarity score descending
    linked.sort(key=lambda x: x["similarityScore"], reverse=True)
    return linked


def find_linked_cases_by_vector(
    query_vector: list[float],
    source_case_id: str,
    source_evidence_id: str,
    top_k: int = MAX_RESULTS,
) -> list[dict[str, Any]]:
    """
    Same as find_linked_cases but accepts a pre-computed vector.
    Useful when the vector is already available to avoid re-embedding.
    """
    raw_results = search_similar(
        query_vector=query_vector,
        top_k=top_k * 5,
        score_threshold=SIMILARITY_THRESHOLD,
    )

    linked: list[dict[str, Any]] = []
    seen_cases: set[str] = set()

    for hit in raw_results:
        payload = hit.payload or {}
        hit_case_id = str(payload.get("caseId", ""))
        hit_evidence_id = str(
            payload.get("linkedEvidenceId") or payload.get("evidence_id") or hit.id
        )

        if hit_evidence_id == str(source_evidence_id):
            continue
        if hit_case_id == str(source_case_id):
            continue
        if hit_case_id in seen_cases:
            continue
        seen_cases.add(hit_case_id)

        linked.append({
            "evidenceId":      hit_evidence_id,
            "caseId":          hit_case_id,
            "caseName":        payload.get("caseName"),
            "department":      payload.get("department"),
            "evidenceName":    payload.get("evidenceName"),
            "similarityScore": round(hit.score, 4),
            "docType":         payload.get("docType"),
            "fileUrl":         payload.get("fileUrl"),
            "uploader":        payload.get("uploader"),
            "uploadTimestamp": payload.get("uploadTimestamp"),
        })

        if len(linked) >= top_k:
            break

    linked.sort(key=lambda x: x["similarityScore"], reverse=True)
    return linked