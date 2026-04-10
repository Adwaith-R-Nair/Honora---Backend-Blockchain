import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchEvidence } from "../../services/api.js";
import { useAuth } from "./useAuth.jsx";

export default function SearchBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await searchEvidence(query.trim(), 10);
      setResults(data.results || []);
      setIsOpen(true);
    } catch (err) {
      setError(err.message || "Search failed. Is the AI service running?");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setResults([]);
    setQuery("");
    setError(null);
  };

  const handleNavigate = (r) => {
    const role = (user?.role || "police").toLowerCase();
    // Supporting docs have evidenceId = "doc-{n}" — use linkedEvidenceId (parent) instead
    const evidenceId = r.payload?.linkedEvidenceId || r.evidenceId || r.id;
    if (evidenceId) {
      handleClose();
      navigate(`/dashboard/${role}/case/${evidenceId}`);
    }
  };

  return (
    <>
      <form onSubmit={handleSearch} style={styles.form}>
        <input
          type="text"
          placeholder="AI Search \u2014 e.g. 'drug trafficking evidence'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "..." : "Search"}
        </button>
      </form>

      {isOpen && (
        <div style={styles.overlay} onClick={handleClose}>
          <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.panelHeader}>
              <h3 style={styles.panelTitle}>
                Search Results {results.length > 0 && `(${results.length})`}
              </h3>
              <button onClick={handleClose} style={styles.closeBtn}>&times;</button>
            </div>

            {error && (
              <p style={styles.error}>{error}</p>
            )}

            {results.length === 0 && !error && (
              <p style={styles.noResults}>No matching evidence found.</p>
            )}

            <div style={styles.resultsList}>
              {results.map((r, i) => (
                <div
                  key={i}
                  style={styles.resultCard}
                  onClick={() => handleNavigate(r)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={styles.resultHeader}>
                    <span style={styles.caseName}>{r.caseName || "Unknown Case"}</span>
                    <span style={styles.score}>
                      {((r.compositeScore || r.semanticScore || 0) * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <div style={styles.resultMeta}>
                    <span>{r.evidenceName || r.payload?.evidenceName || r.payload?.filename || "—"}</span>
                    {(r.department || r.payload?.department) && (
                      <span style={styles.dept}>{r.department || r.payload?.department}</span>
                    )}
                    {(r.docType || r.payload?.docType) && (
                      <span style={styles.docType}>{r.docType || r.payload?.docType}</span>
                    )}
                    {r.caseId && <span style={{ color: '#888' }}>Case #{r.caseId}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#d4af37', cursor: 'pointer' }}>
                      View Case →
                    </span>
                    {(r.fileUrl || r.payload?.fileUrl) && (
                      <a
                        href={r.fileUrl || r.payload?.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.link}
                        onClick={(e) => e.stopPropagation()}
                      >
                        IPFS ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  form: {
    display: "flex",
    gap: "8px",
    maxWidth: "500px",
  },
  input: {
    flex: 1,
    padding: "8px 14px",
    borderRadius: "6px",
    border: "1px solid rgba(212, 175, 55, 0.3)",
    background: "rgba(0,0,0,0.3)",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
  },
  button: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    background: "linear-gradient(135deg, #d4af37, #b8960c)",
    color: "#1a1a2e",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 9999,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "80px",
  },
  panel: {
    width: "90%",
    maxWidth: "700px",
    maxHeight: "70vh",
    background: "rgba(26, 26, 46, 0.97)",
    border: "1px solid rgba(212, 175, 55, 0.3)",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(212, 175, 55, 0.15)",
  },
  panelTitle: {
    margin: 0,
    color: "#d4af37",
    fontSize: "16px",
    fontWeight: 700,
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "24px",
    cursor: "pointer",
  },
  error: {
    color: "#ff6b6b",
    padding: "12px 20px",
    fontSize: "13px",
  },
  noResults: {
    color: "#888",
    padding: "24px 20px",
    textAlign: "center",
    fontStyle: "italic",
    fontSize: "13px",
  },
  resultsList: {
    overflowY: "auto",
    padding: "12px 20px",
  },
  resultCard: {
    padding: "12px 16px",
    marginBottom: "10px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(212, 175, 55, 0.1)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  caseName: {
    color: "#fff",
    fontWeight: 600,
    fontSize: "14px",
  },
  score: {
    color: "#d4af37",
    fontSize: "12px",
    fontWeight: 600,
  },
  resultMeta: {
    display: "flex",
    gap: "12px",
    fontSize: "12px",
    color: "#aaa",
    flexWrap: "wrap",
  },
  dept: {
    background: "rgba(212, 175, 55, 0.15)",
    padding: "2px 8px",
    borderRadius: "4px",
    color: "#d4af37",
  },
  docType: {
    background: "rgba(100, 149, 237, 0.15)",
    padding: "2px 8px",
    borderRadius: "4px",
    color: "#6495ed",
  },
  link: {
    display: "inline-block",
    marginTop: "6px",
    fontSize: "12px",
    color: "#d4af37",
    textDecoration: "none",
  },
};
