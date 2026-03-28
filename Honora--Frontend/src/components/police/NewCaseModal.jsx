import { useState, useRef } from "react";
import { CloseIcon, PlusIcon } from "../../assets/icons/Icons.jsx";

export default function NewCaseModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    caseName: "",
    caseId: "",
    department: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.caseName.trim()) {
      setError("Case name is required.");
      return;
    }
    if (!form.caseId.trim() || isNaN(Number(form.caseId)) || Number(form.caseId) <= 0) {
      setError("Case ID must be a positive number.");
      return;
    }
    if (!form.department.trim()) {
      setError("Department is required.");
      return;
    }
    if (!file) {
      setError("An evidence file is required to register a case.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("caseId", form.caseId.trim());
      fd.append("caseName", form.caseName.trim());
      fd.append("department", form.department.trim());

      await onCreate(fd);
    } catch (err) {
      console.error("Error creating case:", err);
      setError(err.message || "Failed to create case");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal-glass upload-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>

        <div className="modal-icon welcome-gold">
          <PlusIcon />
        </div>
        <h2 className="modal-title">Register New Case</h2>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Case Name</label>
            <input
              type="text"
              placeholder='e.g. "C.C. No. 123/2025 — Theft, Marine Drive"'
              value={form.caseName}
              onChange={(e) => setForm((f) => ({ ...f, caseName: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Case ID (number)</label>
            <input
              type="number"
              min="1"
              placeholder="Unique numeric case identifier"
              value={form.caseId}
              onChange={(e) => setForm((f) => ({ ...f, caseId: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Department</label>
            <input
              type="text"
              placeholder='e.g. "narcotics", "homicide", "robbery"'
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Evidence File</label>
            <div
              className="file-drop-zone"
              onClick={() => fileRef.current?.click()}
              style={{
                border: "1px dashed var(--border)",
                borderRadius: "6px",
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: file ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
                transition: "all 0.3s ease",
              }}
            >
              {file ? (
                <span style={{ color: "var(--gold)", fontSize: "14px" }}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
              ) : (
                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                  Click to select a file (FIR, photo, document, etc.)
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={loading}
              />
            </div>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-btn-row">
            <button
              type="button"
              className="btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn-gold${loading ? " loading" : ""}`}
              disabled={loading}
            >
              {loading ? <span className="loader" /> : "Register Case"}
            </button>
          </div>
        </form>

        <p className="modal-notice">
          Evidence file will be hashed, uploaded to IPFS, and registered on-chain
        </p>
      </div>
    </div>
  );
}
