import { useState } from "react";
import { uploadEvidence } from "../../services/api.js";
import { CloseIcon, PlusIcon } from "../../assets/icons/Icons.jsx";

const FORMATS = ["Video", "Photo", "Text Document", "Voice Note", "Other"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function UploadEvidenceModal({ caseId, onClose, onUpload }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    format: "Video",
    file: null,
    fileName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
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

    // 1. Basic Validation
    if (!form.file) {
      setError("Please select a file to upload.");
      return;
    }
    if (!form.title.trim()) {
      setError("Evidence title is required.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 2. Prepare FormData to match backend expectations
      const formData = new FormData();
      
      // Your backend expects these specific keys:
      formData.append("file", form.file);
      formData.append("caseId", caseId); 
      formData.append("caseName", form.title.trim()); // Mapping 'title' to 'caseName'
      formData.append("department", "General"); // Or add a dept field to your form

      // 3. Call the API
      // Note: your api.js uploadEvidence only takes 'formData' as an argument
      const response = await uploadEvidence(formData);

      if (response.success) {
        // 4. Pass the new evidence back to the UI
        onUpload(response.data); 
        onClose();
      } else {
        setError(response.error || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload to blockchain/IPFS");
    } finally {
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
        <h2 className="modal-title">Upload Evidence</h2>
        <p className="modal-subtitle">Case: {caseId}</p>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Evidence Title</label>
            <input
              type="text"
              placeholder="e.g. Lobby CCTV Footage"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              placeholder="Describe this piece of evidence..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Format</label>
            <select
              value={form.format}
              onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
              disabled={loading}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>File Upload (optional)</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                onChange={handleFile}
                accept="video/*,image/*,audio/*,.pdf,.txt,.doc,.docx"
                disabled={loading}
              />
              <div className="file-input-display">
                <div className="file-input-icon">📂</div>
                <div className="file-input-text">Click or drag to upload file</div>
                {form.fileName && (
                  <div className="file-input-name">{form.fileName}</div>
                )}
              </div>
            </div>
            {form.file && (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                Size: {(form.file.size / 1024 / 1024).toFixed(2)}MB
              </p>
            )}
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="input-group">
              <label>Upload Progress</label>
              <div
                style={{
                  width: "100%",
                  height: "6px",
                  backgroundColor: "rgba(212,175,55,0.2)",
                  borderRadius: "3px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    backgroundColor: "var(--gold)",
                    width: `${uploadProgress}%`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                {uploadProgress}% uploaded
              </p>
            </div>
          )}

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
              {loading ? <span className="loader" /> : "Submit Evidence"}
            </button>
          </div>
        </form>

        <p className="modal-notice">
          🔒 Evidence is cryptographically hashed and logged to chain of custody
        </p>
      </div>
    </div>
  );
}
