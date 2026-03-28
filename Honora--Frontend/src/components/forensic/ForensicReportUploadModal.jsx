import { useState } from "react";
import { uploadForensicReport } from "../../services/api.js";
import { CloseIcon, PlusIcon } from "../../assets/icons/Icons.jsx";

const REPORT_TYPES = [
  "Forensic Report",
  "DNA Analysis",
  "Fingerprint Analysis",
  "Digital Forensics",
  "Chemical Analysis",
  "Toxicology",
];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function ForensicReportUploadModal({ caseId, onClose, onUpload }) {
  const [form, setForm] = useState({
    reportType: "Forensic Report",
    file: null,
    fileName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File too large. Max: 50MB (yours: ${(file.size / 1024 / 1024).toFixed(2)}MB)`
      );
      return;
    }

    setError("");
    setForm((f) => ({ ...f, file, fileName: file.name }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.file) {
      setError("A forensic report file is required.");
      return;
    }
    if (form.file.size > MAX_FILE_SIZE) {
      setError("File exceeds 50MB limit");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", form.file);
      formData.append("evidenceId", String(caseId));
      formData.append("docType", form.reportType.toLowerCase().replace(/ /g, "_"));

      const response = await uploadForensicReport(formData);
      const doc = response.data || response;

      onUpload({
        ...doc,
        id: doc.docId,
        format: doc.docType,
        filename: doc.filename,
      });
      setLoading(false);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload report");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlay}>
      <div className="modal-glass upload-modal">
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close"
          disabled={loading}
        >
          <CloseIcon />
        </button>

        <div className="modal-icon welcome-gold">
          <PlusIcon />
        </div>
        <h2 className="modal-title">Upload Forensic Report</h2>
        <p className="modal-subtitle">Case: {caseId}</p>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Report Type</label>
            <select
              value={form.reportType}
              onChange={(e) => setForm((f) => ({ ...f, reportType: e.target.value }))}
              disabled={loading}
            >
              {REPORT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Report File</label>
            <div
              className="file-drop-zone"
              onClick={() => document.getElementById("forensic-file-input")?.click()}
              style={{
                border: `1px dashed ${form.file ? "var(--gold)" : "var(--border)"}`,
                borderRadius: "6px",
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: form.file ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
                transition: "all 0.3s ease",
              }}
            >
              {form.file ? (
                <span style={{ color: "var(--gold)", fontSize: "14px" }}>
                  {form.fileName} ({(form.file.size / 1024).toFixed(1)} KB)
                </span>
              ) : (
                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                  Click to select a forensic report file
                </span>
              )}
              <input
                id="forensic-file-input"
                type="file"
                style={{ display: "none" }}
                onChange={handleFile}
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
              {loading ? <span className="loader" /> : "Submit Report"}
            </button>
          </div>
        </form>

        <p className="modal-notice">
          🔒 Report is timestamped, digitally signed, and logged for chain of custody
        </p>
      </div>
    </div>
  );
}
