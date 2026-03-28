import { useAuth } from "../common/useAuth.jsx";
import { getCaseById, getLawyerDocuments, getCases } from "../../services/api.js";
import { getStatusBadgeClass } from "../../utils/helpers.js";
import EvidenceSection from "../common/EvidenceSection.jsx";
import { useState, useEffect } from "react";

export default function JudgeCaseDetails({ caseId, onBack }) {
  const { user } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [forensicReports, setForensicReports] = useState([]);
  const [lawyerDocuments, setLawyerDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCaseData();
  }, [caseId]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch case details
      const caseResponse = await getCaseById(decodeURIComponent(caseId));
      const cData = caseResponse.data || caseResponse;
      const numericCaseId = cData.caseId;
      setCaseData({
        ...cData,
        id: cData.evidenceId || cData.caseId,
        title: cData.caseName,
        status: cData.status || "Open",
        court: cData.court || "District Court",
      });

      // Fetch ALL evidence items for this case
      const allEvidenceRes = await getCases();
      const allEvidence = (allEvidenceRes.data || []).filter(
        (e) => String(e.caseId) === String(numericCaseId)
      );
      setEvidence(
        allEvidence.map((e) => ({ ...e, format: "Text Document", id: e.evidenceId }))
      );

      // Fetch supporting docs for ALL evidence items in this case
      try {
        const allDocs = [];
        for (const ev of allEvidence) {
          try {
            const res = await getLawyerDocuments(ev.evidenceId);
            const docs = res.data || [];
            if (Array.isArray(docs)) allDocs.push(...docs);
          } catch (_) {
            // No docs for this evidenceId
          }
        }
        const mapped = allDocs.map((d) => ({
          ...d, id: d.docId, format: d.docType, filename: d.filename,
        }));
        const forensic = [];
        const lawyer = [];
        for (const doc of mapped) {
          if (["forensic_report", "dna_analysis", "fingerprint_analysis", "digital_forensics", "chemical_analysis", "toxicology"].some(t => doc.docType?.includes(t))) {
            forensic.push(doc);
          } else {
            lawyer.push(doc);
          }
        }
        setForensicReports(forensic);
        setLawyerDocuments(lawyer);
      } catch (err) {
        console.log("No supporting documents:", err.message);
        setForensicReports([]);
        setLawyerDocuments([]);
      }
    } catch (err) {
      console.error("Error fetching case data:", err);
      setError(err.message || "Failed to load case details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="judge-dashboard">
        <button className="judge-back-btn" onClick={onBack}>
          ← Back
        </button>
        <p style={{ color: "rgba(240,234,216,0.4)", marginTop: "2rem", fontFamily: "'Josefin Sans',sans-serif", fontSize: "13px" }}>
          Loading case details...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="judge-dashboard">
        <button className="judge-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div
          style={{
            padding: "20px",
            marginTop: "2rem",
            backgroundColor: "rgba(255,0,0,0.1)",
            border: "1px solid #ff6b6b",
            borderRadius: "6px",
            color: "#ff6b6b",
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="judge-dashboard">
        <button className="judge-back-btn" onClick={onBack}>
          ← Back
        </button>
        <p style={{ color: "rgba(240,234,216,0.4)", marginTop: "2rem", fontFamily: "'Josefin Sans',sans-serif", fontSize: "13px" }}>
          Case record not found.
        </p>
      </div>
    );
  }

  return (
    <div className="judge-dashboard">
      <button className="judge-back-btn" onClick={onBack}>
        ← Back to Docket
      </button>

      <div style={{ animation: "jFadeUp 0.45s ease both" }}>
        <p className="judge-eyebrow">Case Record — {caseData.id}</p>
        <h1 className="judge-title">{caseData.title}</h1>

        <div className="judge-meta-grid">
          {[
            ["Case ID", caseData.id],
            ["Court", caseData.court || "N/A"],
            ["Presiding Judge", user?.username || "Unknown"],
            ["Next Hearing", caseData.nextHearing || "N/A"],
          ].map(([l, v]) => (
            <div className="judge-meta-item" key={l}>
              <span className="judge-meta-label">{l}</span>
              <span className="judge-meta-value">{v}</span>
            </div>
          ))}
          <div className="judge-meta-item">
            <span className="judge-meta-label">Status</span>
            <span
              className={`judge-badge ${getStatusBadgeClass(caseData.status)}`}
              style={{ marginTop: "0.2rem", display: "inline-block" }}
            >
              {caseData.status}
            </span>
          </div>
        </div>
      </div>

      <div className="judge-divider" />

      {evidence.length === 0 ? (
        <p
          style={{
            color: "rgba(240,234,216,0.3)",
            fontStyle: "italic",
            fontSize: "13px",
            marginTop: "1rem",
            fontFamily: "'Josefin Sans',sans-serif",
          }}
        >
          No evidence has been submitted for this case.
        </p>
      ) : (
        <EvidenceSection evidence={evidence} caseId={caseId} />
      )}

      {forensicReports.length > 0 && (
        <>
          <div className="judge-divider" />
          <div style={{ marginBottom: 36 }}>
            <p
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.3em",
                color: "#D4AF37",
                fontWeight: 600,
                marginBottom: 10,
                textTransform: "uppercase",
                fontFamily: "'Josefin Sans',sans-serif",
              }}
            >
              FORENSIC ANALYSIS
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: "clamp(1.3rem,3vw,2rem)",
                color: "#f0ead8",
                fontWeight: 700,
              }}
            >
              Forensic Report
            </h2>
          </div>
          <EvidenceSection evidence={forensicReports} caseId={caseId} />
        </>
      )}

      {lawyerDocuments.length > 0 && (
        <>
          <div className="judge-divider" />
          <div style={{ marginBottom: 36 }}>
            <p
              style={{
                fontSize: "0.72rem",
                letterSpacing: "0.3em",
                color: "#D4AF37",
                fontWeight: 600,
                marginBottom: 10,
                textTransform: "uppercase",
                fontFamily: "'Josefin Sans',sans-serif",
              }}
            >
              LAWYER SUBMISSIONS
            </p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: "clamp(1.3rem,3vw,2rem)",
                color: "#f0ead8",
                fontWeight: 700,
              }}
            >
              Supporting Documents
            </h2>
          </div>
          <EvidenceSection evidence={lawyerDocuments} caseId={caseId} />
        </>
      )}
    </div>
  );
}
