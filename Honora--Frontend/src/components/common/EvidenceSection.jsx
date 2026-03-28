// components/common/EvidenceSection.jsx
// All case evidence in one flat list, grouped by format.

import { useState } from "react";
import EvidenceModal from "./EvidenceModal";

const FORMAT_ORDER  = [
  "video", "Video", "photo", "Photo", "text", "Text Document",
  "voice", "Voice Note", "legal_brief", "affidavit", "motion", "petition",
  "evidence_document", "forensic_report", "dna_analysis", "fingerprint_analysis",
  "digital_forensics", "chemical_analysis", "toxicology", "court_filing", "Other"
];
const FORMAT_LABELS = {
  video:"Video Evidence", Video:"Video Evidence",
  photo:"Photo Evidence", Photo:"Photo Evidence",
  text:"Text Documents", "Text Document":"Text Documents",
  voice:"Voice Notes", "Voice Note":"Voice Notes",
  legal_brief: "Legal Briefs",
  affidavit: "Affidavits",
  motion: "Motions",
  petition: "Petitions",
  evidence_document: "Evidence Documents",
  forensic_report: "Forensic Reports",
  dna_analysis: "DNA Analysis",
  fingerprint_analysis: "Fingerprint Analysis",
  digital_forensics: "Digital Forensics",
  chemical_analysis: "Chemical Analysis",
  toxicology: "Toxicology Reports",
  court_filing: "Court Filings",
  Other: "Other Files",
};
const FORMAT_ICONS  = {
  video:"▶", Video:"▶",
  photo:"◉", Photo:"◉",
  text:"≡", "Text Document":"≡",
  voice:"♪", "Voice Note":"♪",
  legal_brief: "⚖️",
  affidavit: "📝",
  motion: "📄",
  petition: "📋",
  evidence_document: "📑",
  forensic_report: "🔬",
  dna_analysis: "🧬",
  fingerprint_analysis: "🔍",
  digital_forensics: "💻",
  chemical_analysis: "⚗️",
  toxicology: "🧪",
  court_filing: "⚖️",
  Other: "📁",
};

function EvidenceCard({ ev, onView, delay }) {
  const title = ev.title || ev.filename || ev.caseName || "Untitled";
  const desc = ev.description || ev.caseName || ev.docType || "";
  const uploader = ev.lawyerName || ev.uploadedBy || "";
  const date = ev.uploadDate || (ev.timestamp ? new Date(Number(ev.timestamp) * 1000).toLocaleDateString() : "");
  return (
    <div className="evidence-card" style={{ animationDelay:`${delay}s` }}>
      <div className="ev-card-top">
        <div className="ev-format-icon">{FORMAT_ICONS[ev.format] || "📄"}</div>
        <div className="ev-body">
          <div className="ev-title">{title}</div>
          <div className="ev-desc">{desc}</div>
          <div className="ev-meta">
            {uploader && <span>By: {uploader.length > 15 ? `${uploader.substring(0, 6)}...${uploader.slice(-4)}` : uploader}</span>}
            {date && <span>{date}</span>}
          </div>
        </div>
      </div>
      <div className="ev-card-footer">
        <button className="btn-gold ev-view-btn" onClick={() => onView(ev)}>View</button>
      </div>
    </div>
  );
}

export default function EvidenceSection({ evidence, caseId }) {
  const [selectedEv, setSelectedEv] = useState(null);
  let idx = 0;

  return (
    <>
      <div className="evidence-container">
        {FORMAT_ORDER.map((fmt) => {
          const items = evidence.filter(e => e.format === fmt);
          const base  = idx;
          idx += items.length;
          if (items.length === 0) return null;
          return (
            <div className="format-group" key={fmt}>
              <div className="format-heading">
                <span className="format-heading-icon">{FORMAT_ICONS[fmt]}</span>
                {FORMAT_LABELS[fmt]}
              </div>
              <div className="evidence-list">
                {items.map((ev, i) => (
                  <EvidenceCard key={ev.id} ev={ev} onView={setSelectedEv} delay={(base + i) * 0.07} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedEv && (
        <EvidenceModal ev={selectedEv} caseId={caseId} onClose={() => setSelectedEv(null)} />
      )}
    </>
  );
}
