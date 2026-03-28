import { useNavigate } from "react-router-dom";
import { updateCaseStatus } from "../../services/api.js";

const STATUSES = ["Open", "Under Investigation", "Closed"];

const STATUS_COLORS = {
  "Open": { bg: "rgba(240,208,96,0.15)", color: "#f0d060" },
  "Under Investigation": { bg: "rgba(255,183,77,0.15)", color: "#ffb74d" },
  "Closed": { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
};

export default function CaseCard({ caseData, delay = 0, onStatusChange }) {
  const navigate = useNavigate();
  const evidenceId = caseData.evidenceId;
  const caseId = caseData.caseId;

  const handleView = () => navigate(`/dashboard/police/case/${evidenceId}`);

  const addRipple = (e) => {
    const btn = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = btn.getBoundingClientRect();
    ripple.className = "ripple";
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
    handleView();
  };

  const title = caseData.caseName || "Unnamed Case";
  const date = new Date(caseData.timestamp * 1000).toLocaleDateString();
  const department = caseData.department || "General";
  const status = caseData.status || "Under Investigation";
  const colors = STATUS_COLORS[status] || STATUS_COLORS["Under Investigation"];

  const handleStatusChange = async (e) => {
    e.stopPropagation();
    const newStatus = e.target.value;

    // Optimistic update
    if (onStatusChange) onStatusChange(caseId, newStatus);

    try {
      await updateCaseStatus(evidenceId, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
      // Revert on failure
      if (onStatusChange) onStatusChange(caseId, status);
    }
  };

  return (
    <div className={`case-card card-delay-${delay}`}>
      <div className="cc-glow" />
      <div className="cc-id">EV-{evidenceId}</div>
      <div className="cc-main">
        <div className="cc-title">{title}</div>
        <div className="cc-date">Filed: {date} &nbsp;·&nbsp; Dept: {department}</div>
      </div>
      <select
        value={status}
        onChange={handleStatusChange}
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: colors.bg,
          color: colors.color,
          border: `1px solid ${colors.color}40`,
          borderRadius: "4px",
          padding: "6px 10px",
          fontSize: "0.78rem",
          fontWeight: 600,
          fontFamily: "var(--font-body)",
          cursor: "pointer",
          outline: "none",
          appearance: "none",
          WebkitAppearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='${encodeURIComponent(colors.color)}'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          paddingRight: "24px",
        }}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} style={{ backgroundColor: "#1a1a2e", color: "#e0e0e0" }}>
            {s}
          </option>
        ))}
      </select>
      <button className="btn-gold sm" onClick={addRipple}>
        View →
      </button>
    </div>
  );
}
