// components/common/EvidenceModal.jsx
// Updated for Honora Blockchain + IPFS Integration

const FORMAT_ICONS = { Video: "▶", Photo: "◉", "Text Document": "≡", "Voice Note": "♪" };

export default function EvidenceModal({ ev, caseId, onClose }) {
  if (!ev) return null;

  const renderPreview = () => {
    // Use the ipfsUrl provided by your backend/Pinata
    const fileUrl = ev.ipfsUrl;

    if (ev.format === "Photo")
      return fileUrl ? (
        <img src={fileUrl} alt={ev.filename} className="ev-preview-img" />
      ) : (
        <div className="ev-preview-placeholder">◉ Image not available</div>
      );

    if (ev.format === "Video")
      return fileUrl ? (
        <video controls className="ev-preview-video">
          <source src={fileUrl} />
        </video>
      ) : (
        <div className="ev-preview-placeholder">▶ Video not available</div>
      );

    if (ev.format === "Voice Note")
      return fileUrl ? (
        <audio controls className="ev-preview-audio">
          <source src={fileUrl} />
        </audio>
      ) : (
        <div className="ev-preview-placeholder">♪ Audio not available</div>
      );

    if (ev.format === "Text Document")
      return (
        <div className="ev-preview-text">
          <p>Document: {ev.filename}</p>
          <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-gold sm">
            Open Document Externally
          </a>
        </div>
      );

    return <div className="ev-preview-placeholder">Preview unavailable</div>;
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="ev-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <p className="ev-modal-tag">Digital Evidence Record — {ev.format?.toUpperCase()}</p>
        <h2 className="ev-modal-title">{ev.filename}</h2>

        <div className="ev-modal-meta-row">
          {[
            ["Evidence ID", `EV-${ev.evidenceId}`],
            ["Case ID", caseId],
            ["Uploader", ev.uploadedBy ? `${ev.uploadedBy.substring(0, 10)}...` : "N/A"],
          ].map(([l, v]) => (
            <div className="ev-modal-meta-item" key={l}>
              <span className="ev-modal-meta-label">{l}</span>
              <span className="ev-modal-meta-value">{v}</span>
            </div>
          ))}
        </div>

        {/* Blockchain Verification Section */}
        <div className="blockchain-verification-box" style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--gold-dim)', borderRadius: '4px', margin: '16px 0' }}>
          <p style={{ fontSize: '10px', color: 'var(--gold)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Verified Blockchain Hash (SHA-256)</p>
          <code style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{ev.fileHash}</code>
        </div>

        <div className="ev-preview-area">{renderPreview()}</div>

        <div style={{ marginTop: '16px', textAlign: 'right' }}>
           <a href={ev.ipfsUrl} target="_blank" rel="noreferrer" className="link-button" style={{ fontSize: '12px' }}>
             View on IPFS Gateway ↗
           </a>
        </div>
      </div>
    </div>
  );
}