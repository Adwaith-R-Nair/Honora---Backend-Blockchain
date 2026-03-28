// components/lawyer/LawyerCaseCard.jsx

import { getStatusBadgeClass } from "../../utils/helpers";

export default function LawyerCaseCard({ c, onView, delay }) {
  const date = c.timestamp
    ? new Date(c.timestamp * 1000).toLocaleDateString()
    : "N/A";

  return (
    <div
      className={`lawyer-case-card card-delay-${delay}`}
      onClick={() => onView(c.id)}
    >
      <div className="case-card-main">
        <div className="case-id-tag">Case #{c.caseId}</div>
        <div className="case-card-title">{c.title || c.caseName || "Unnamed Case"}</div>
        <div className="case-card-court">🏛 {c.department || "General"}</div>
      </div>
      <span className={`badge ${getStatusBadgeClass(c.status)}`}>{c.status || "Open"}</span>
      <div>
        <div className="case-date">📅 Filed: {date}</div>
        <button
          className="btn-gold ev-view-btn mt-2"
          onClick={(e) => { e.stopPropagation(); onView(c.id); }}
        >
          View →
        </button>
      </div>
    </div>
  );
}
