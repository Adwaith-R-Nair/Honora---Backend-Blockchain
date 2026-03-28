// components/judge/JudgeCaseCard.jsx

import { getStatusBadgeClass } from "../../utils/helpers";

export default function JudgeCaseCard({ c, onView, delay }) {
  return (
    <div
      className={`judge-case-card card-delay-${delay}`}
      onClick={() => onView(c.id)}
    >
      <div>
        <div className="judge-case-id">Case #{c.caseId}</div>
        <div className="judge-case-title">{c.title || c.caseName || "Unnamed Case"}</div>
        <div className="judge-case-court">🏛 {c.department || "General"}</div>
      </div>
      <span className={`judge-badge ${getStatusBadgeClass(c.status)}`}>{c.status || "Open"}</span>
      <div className="judge-date-col">
        <div className="judge-date-label">Filed On</div>
        <div className="judge-date-val">{c.timestamp ? new Date(c.timestamp * 1000).toLocaleDateString() : "N/A"}</div>
      </div>
      <button
        className="judge-view-btn"
        onClick={(e) => { e.stopPropagation(); onView(c.id); }}
      >
        View →
      </button>
    </div>
  );
}
