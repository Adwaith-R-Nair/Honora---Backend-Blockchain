// components/common/EvidenceModal.jsx
// Honora Blockchain + IPFS Integration + Chain of Custody + Integrity Verification

import { useState, useEffect, useRef } from "react";
import { getCustodyHistory, verifyIntegrity, transferCustody, getCrossCaseLinkage } from "../../services/api.js";
import { useAuth } from "./useAuth.jsx";

const FORMAT_ICONS = { Video: "▶", Photo: "◉", "Text Document": "≡", "Voice Note": "♪" };

function truncateAddress(addr) {
  if (!addr) return "N/A";
  return `${addr.substring(0, 6)}...${addr.slice(-4)}`;
}

export default function EvidenceModal({ ev, caseId, onClose }) {
  const { user } = useAuth();
  const canVerify = user?.role === "Forensic" || user?.role === "Judge";
  const canTransfer = user?.role === "Police" || user?.role === "Forensic";

  // -- Chain of Custody state --
  const [custodyHistory, setCustodyHistory] = useState([]);
  const [custodyLoading, setCustodyLoading] = useState(false);
  const [showCustody, setShowCustody] = useState(false);

  // -- Integrity Verification state --
  const [showVerify, setShowVerify] = useState(false);
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");
  const fileInputRef = useRef(null);

  // -- Custody Transfer state --
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  const [transferError, setTransferError] = useState("");

  // -- Cross-Case Linkage state --
  const [showLinkage, setShowLinkage] = useState(false);
  const [linkageResults, setLinkageResults] = useState([]);
  const [linkageLoading, setLinkageLoading] = useState(false);
  const [linkageError, setLinkageError] = useState("");

  useEffect(() => {
    if (ev?.evidenceId && showCustody && custodyHistory.length === 0) {
      fetchCustodyHistory();
    }
  }, [ev?.evidenceId, showCustody]);

  useEffect(() => {
    if (ev?.evidenceId && showLinkage && linkageResults.length === 0 && !linkageError) {
      fetchLinkage();
    }
  }, [ev?.evidenceId, showLinkage]);

  const fetchCustodyHistory = async () => {
    try {
      setCustodyLoading(true);
      const res = await getCustodyHistory(ev.evidenceId);
      setCustodyHistory(res.data || []);
    } catch (err) {
      console.error("Error fetching custody history:", err);
      setCustodyHistory([]);
    } finally {
      setCustodyLoading(false);
    }
  };

  const fetchLinkage = async () => {
    try {
      setLinkageLoading(true);
      setLinkageError("");
      const res = await getCrossCaseLinkage(ev.evidenceId, 10);
      setLinkageResults(res.linkedCases || res.linked_cases || []);
    } catch (err) {
      console.error("Cross-case linkage error:", err);
      setLinkageError(err.message || "Failed to fetch cross-case links. Is the AI service running?");
      setLinkageResults([]);
    } finally {
      setLinkageLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyFile) {
      setVerifyError("Please select a file to verify.");
      return;
    }
    setVerifyError("");
    setVerifyResult(null);
    setVerifyLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", verifyFile);
      const res = await verifyIntegrity(ev.evidenceId, formData);
      setVerifyResult(res.data || res);
    } catch (err) {
      console.error("Verification error:", err);
      setVerifyError(err.message || "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleTransfer = async () => {
    const addr = transferAddress.trim();
    if (!addr) {
      setTransferError("Please enter a wallet address.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
      setTransferError("Invalid Ethereum address. Must be 0x followed by 40 hex characters.");
      return;
    }
    setTransferError("");
    setTransferResult(null);
    setTransferLoading(true);

    try {
      const res = await transferCustody(ev.evidenceId, addr);
      setTransferResult(res.data || res);
      // Refresh custody history if it was already loaded
      if (showCustody) {
        setCustodyHistory([]);
        fetchCustodyHistory();
      }
    } catch (err) {
      console.error("Transfer error:", err);
      setTransferError(err.message || "Custody transfer failed");
    } finally {
      setTransferLoading(false);
    }
  };

  if (!ev) return null;

  const renderPreview = () => {
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

  const collapsibleBtnStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(212, 175, 55, 0.08)',
    border: '1px solid var(--gold-dim)',
    borderRadius: '6px',
    color: 'var(--gold)',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'var(--font-body)',
  };

  const collapsibleBodyStyle = {
    padding: '16px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border)',
    borderTop: 'none',
    borderRadius: '0 0 6px 6px',
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
            ["Uploader", ev.uploadedBy ? truncateAddress(ev.uploadedBy) : "N/A"],
          ].map(([l, v]) => (
            <div className="ev-modal-meta-item" key={l}>
              <span className="ev-modal-meta-label">{l}</span>
              <span className="ev-modal-meta-value">{v}</span>
            </div>
          ))}
        </div>

        {/* Blockchain Hash */}
        <div style={{ padding: '12px', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid var(--gold-dim)', borderRadius: '4px', margin: '16px 0' }}>
          <p style={{ fontSize: '10px', color: 'var(--gold)', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Verified Blockchain Hash (SHA-256)</p>
          <code style={{ fontSize: '11px', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{ev.fileHash}</code>
        </div>

        <div className="ev-preview-area">{renderPreview()}</div>

        {/* Chain of Custody Section */}
        <div style={{ margin: '20px 0 8px' }}>
          <button
            onClick={() => setShowCustody(!showCustody)}
            style={showCustody ? { ...collapsibleBtnStyle, borderRadius: '6px 6px 0 0' } : collapsibleBtnStyle}
          >
            <span>Chain of Custody</span>
            <span style={{ fontSize: '14px' }}>{showCustody ? '▾' : '▸'}</span>
          </button>

          {showCustody && (
            <div style={collapsibleBodyStyle}>
              {custodyLoading ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
                  Loading custody history...
                </p>
              ) : custodyHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    No custody transfers recorded.
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                    Evidence is still with the original uploader.
                  </p>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: '8px', top: '8px', bottom: '8px',
                    width: '2px', background: 'var(--gold-dim)',
                  }} />
                  {custodyHistory.map((entry, i) => {
                    const ts = entry.timestamp
                      ? new Date(Number(entry.timestamp) * 1000).toLocaleString()
                      : "N/A";
                    return (
                      <div key={i} style={{
                        display: 'flex', gap: '14px',
                        marginBottom: i < custodyHistory.length - 1 ? '16px' : 0,
                        position: 'relative',
                      }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: i === 0 ? 'var(--gold)' : 'rgba(212, 175, 55, 0.3)',
                          border: '2px solid var(--gold)', flexShrink: 0, zIndex: 1,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{ts}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '2px' }}>
                            <span style={{ color: 'var(--gold-dim)' }}>From:</span>{' '}
                            <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{truncateAddress(entry.from)}</code>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                            <span style={{ color: 'var(--gold-dim)' }}>To:</span>{' '}
                            <code style={{ fontSize: '11px', wordBreak: 'break-all' }}>{truncateAddress(entry.to)}</code>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cross-Case Linkage Section — All roles */}
        {ev.evidenceId && (
          <div style={{ margin: '8px 0' }}>
            <button
              onClick={() => setShowLinkage(!showLinkage)}
              style={showLinkage ? { ...collapsibleBtnStyle, borderRadius: '6px 6px 0 0' } : collapsibleBtnStyle}
            >
              <span>Cross-Case Linkage (AI)</span>
              <span style={{ fontSize: '14px' }}>{showLinkage ? '▾' : '▸'}</span>
            </button>

            {showLinkage && (
              <div style={collapsibleBodyStyle}>
                {linkageLoading ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>
                    Analyzing cross-case connections...
                  </p>
                ) : linkageError ? (
                  <div style={{
                    padding: '10px 12px',
                    background: 'rgba(255,0,0,0.1)', border: '1px solid #ff6b6b',
                    borderRadius: '6px', color: '#ff6b6b', fontSize: '12px',
                  }}>
                    {linkageError}
                  </div>
                ) : linkageResults.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                      No cross-case links found for this evidence.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                      AI-detected connections to other cases based on semantic similarity:
                    </p>
                    {linkageResults.map((linked, i) => {
                      const score = linked.similarityScore || linked.score || 0;
                      const scorePercent = (score * 100).toFixed(0);
                      const barColor = score > 0.7 ? '#ff6b6b' : score > 0.4 ? '#ffb74d' : '#4ade80';
                      return (
                        <div key={i} style={{
                          padding: '10px 12px',
                          marginBottom: i < linkageResults.length - 1 ? '8px' : 0,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--text)', fontSize: '13px', fontWeight: 600 }}>
                              {linked.caseName || `Case #${linked.caseId}`}
                            </span>
                            <span style={{ color: barColor, fontSize: '12px', fontWeight: 700 }}>
                              {scorePercent}% similar
                            </span>
                          </div>
                          {/* Similarity bar */}
                          <div style={{
                            width: '100%', height: '4px', borderRadius: '2px',
                            background: 'rgba(255,255,255,0.08)', marginBottom: '6px',
                          }}>
                            <div style={{
                              width: `${scorePercent}%`, height: '100%', borderRadius: '2px',
                              background: barColor, transition: 'width 0.5s ease',
                            }} />
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {linked.department && (
                              <span style={{
                                background: 'rgba(212, 175, 55, 0.15)',
                                padding: '1px 6px', borderRadius: '3px', color: '#d4af37',
                              }}>
                                {linked.department}
                              </span>
                            )}
                            {linked.evidenceName || linked.filename ? (
                              <span>{linked.evidenceName || linked.filename}</span>
                            ) : null}
                            {linked.docType && (
                              <span style={{
                                background: 'rgba(100, 149, 237, 0.15)',
                                padding: '1px 6px', borderRadius: '3px', color: '#6495ed',
                              }}>
                                {linked.docType}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Integrity Verification Section — Forensic & Judge only */}
        {canVerify && ev.evidenceId && (
          <div style={{ margin: '8px 0' }}>
            <button
              onClick={() => setShowVerify(!showVerify)}
              style={showVerify ? { ...collapsibleBtnStyle, borderRadius: '6px 6px 0 0' } : collapsibleBtnStyle}
            >
              <span>Verify Evidence Integrity</span>
              <span style={{ fontSize: '14px' }}>{showVerify ? '▾' : '▸'}</span>
            </button>

            {showVerify && (
              <div style={collapsibleBodyStyle}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Upload the original evidence file to verify its SHA-256 hash matches the on-chain record.
                  This confirms the file has not been tampered with.
                </p>

                {/* File picker */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1px dashed ${verifyFile ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '6px',
                    padding: '16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: verifyFile ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.3s ease',
                    marginBottom: '12px',
                  }}
                >
                  {verifyFile ? (
                    <span style={{ color: 'var(--gold)', fontSize: '13px' }}>
                      {verifyFile.name} ({(verifyFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      Click to select the evidence file for verification
                    </span>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      setVerifyFile(e.target.files[0] || null);
                      setVerifyResult(null);
                      setVerifyError("");
                    }}
                  />
                </div>

                <button
                  onClick={handleVerify}
                  disabled={verifyLoading || !verifyFile}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: verifyLoading ? 'rgba(212, 175, 55, 0.2)' : 'var(--gold)',
                    color: verifyLoading ? 'var(--gold)' : '#0d0d1a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: verifyLoading || !verifyFile ? 'not-allowed' : 'pointer',
                    opacity: !verifyFile ? 0.5 : 1,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {verifyLoading ? "Verifying on blockchain..." : "Run Integrity Check"}
                </button>

                {/* Verification Error */}
                {verifyError && (
                  <div style={{
                    marginTop: '12px', padding: '10px 12px',
                    background: 'rgba(255,0,0,0.1)', border: '1px solid #ff6b6b',
                    borderRadius: '6px', color: '#ff6b6b', fontSize: '12px',
                  }}>
                    {verifyError}
                  </div>
                )}

                {/* Verification Result */}
                {verifyResult && (
                  <div style={{
                    marginTop: '12px', padding: '14px',
                    background: verifyResult.passed ? 'rgba(74,222,128,0.08)' : 'rgba(255,107,107,0.08)',
                    border: `1px solid ${verifyResult.passed ? '#4ade80' : '#ff6b6b'}`,
                    borderRadius: '6px',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
                    }}>
                      <span style={{
                        fontSize: '20px',
                        color: verifyResult.passed ? '#4ade80' : '#ff6b6b',
                      }}>
                        {verifyResult.passed ? '✓' : '✗'}
                      </span>
                      <span style={{
                        fontSize: '14px', fontWeight: 700,
                        color: verifyResult.passed ? '#4ade80' : '#ff6b6b',
                      }}>
                        {verifyResult.passed ? 'INTEGRITY VERIFIED' : 'INTEGRITY FAILED'}
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                      {verifyResult.message}
                    </p>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: 'var(--gold-dim)' }}>Computed Hash:</span>
                        <code style={{ display: 'block', wordBreak: 'break-all', marginTop: '2px' }}>
                          {verifyResult.computedHash}
                        </code>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: 'var(--gold-dim)' }}>On-Chain Hash:</span>
                        <code style={{ display: 'block', wordBreak: 'break-all', marginTop: '2px' }}>
                          {verifyResult.onChainHash}
                        </code>
                      </div>
                      {verifyResult.txHash && (
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ color: 'var(--gold-dim)' }}>Tx Hash:</span>
                          <code style={{ display: 'block', wordBreak: 'break-all', marginTop: '2px' }}>
                            {verifyResult.txHash}
                          </code>
                        </div>
                      )}
                      {verifyResult.verifiedBy && (
                        <div>
                          <span style={{ color: 'var(--gold-dim)' }}>Verified By:</span>{' '}
                          <code>{truncateAddress(verifyResult.verifiedBy)}</code>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Custody Transfer Section — Police & Forensic only */}
        {canTransfer && ev.evidenceId && (
          <div style={{ margin: '8px 0' }}>
            <button
              onClick={() => setShowTransfer(!showTransfer)}
              style={showTransfer ? { ...collapsibleBtnStyle, borderRadius: '6px 6px 0 0' } : collapsibleBtnStyle}
            >
              <span>Transfer Custody</span>
              <span style={{ fontSize: '14px' }}>{showTransfer ? '▾' : '▸'}</span>
            </button>

            {showTransfer && (
              <div style={collapsibleBodyStyle}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Transfer this evidence to another party by entering their Ethereum wallet address.
                  This action is recorded permanently on the blockchain.
                </p>

                <input
                  type="text"
                  placeholder="0x... (recipient wallet address)"
                  value={transferAddress}
                  onChange={(e) => {
                    setTransferAddress(e.target.value);
                    setTransferResult(null);
                    setTransferError("");
                  }}
                  disabled={transferLoading}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    marginBottom: '12px',
                    boxSizing: 'border-box',
                  }}
                />

                <button
                  onClick={handleTransfer}
                  disabled={transferLoading || !transferAddress.trim()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: transferLoading ? 'rgba(212, 175, 55, 0.2)' : 'var(--gold)',
                    color: transferLoading ? 'var(--gold)' : '#0d0d1a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: transferLoading || !transferAddress.trim() ? 'not-allowed' : 'pointer',
                    opacity: !transferAddress.trim() ? 0.5 : 1,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {transferLoading ? "Recording on blockchain..." : "Transfer Custody"}
                </button>

                {transferError && (
                  <div style={{
                    marginTop: '12px', padding: '10px 12px',
                    background: 'rgba(255,0,0,0.1)', border: '1px solid #ff6b6b',
                    borderRadius: '6px', color: '#ff6b6b', fontSize: '12px',
                  }}>
                    {transferError}
                  </div>
                )}

                {transferResult && (
                  <div style={{
                    marginTop: '12px', padding: '14px',
                    background: 'rgba(74,222,128,0.08)',
                    border: '1px solid #4ade80',
                    borderRadius: '6px',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px',
                    }}>
                      <span style={{ fontSize: '20px', color: '#4ade80' }}>✓</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#4ade80' }}>
                        CUSTODY TRANSFERRED
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: 'var(--gold-dim)' }}>From:</span>{' '}
                        <code style={{ wordBreak: 'break-all' }}>{truncateAddress(transferResult.transferredBy)}</code>
                      </div>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ color: 'var(--gold-dim)' }}>To:</span>{' '}
                        <code style={{ wordBreak: 'break-all' }}>{truncateAddress(transferResult.newHolder)}</code>
                      </div>
                      {transferResult.txHash && (
                        <div>
                          <span style={{ color: 'var(--gold-dim)' }}>Tx Hash:</span>
                          <code style={{ display: 'block', wordBreak: 'break-all', marginTop: '2px' }}>
                            {transferResult.txHash}
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '12px', textAlign: 'right' }}>
           <a href={ev.ipfsUrl} target="_blank" rel="noreferrer" className="link-button" style={{ fontSize: '12px' }}>
             View on IPFS Gateway ↗
           </a>
        </div>
      </div>
    </div>
  );
}
