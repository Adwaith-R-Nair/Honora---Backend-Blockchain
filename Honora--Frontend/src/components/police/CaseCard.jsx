import { useNavigate } from "react-router-dom";

const STATUS_CLASS = {
  "Open": "status-open",
  "Closed": "status-closed",
  "Under Investigation": "status-investigating",
};

export default function CaseCard({ caseData, delay = 0 }) {
  const navigate = useNavigate();

  // 1. Correct the ID: use evidenceId from your backend/blockchain 
  const evidenceId = caseData.evidenceId;

  // 2. Correct the Navigation: point to the evidence details 
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

  // 3. Map backend fields to UI fields 
  const title = caseData.caseName || "Unnamed Case";
  const date = new Date(caseData.timestamp * 1000).toLocaleDateString();
  const department = caseData.department || "General";
  const status = caseData.status || "Under Investigation";

  return (
    <div className={`case-card card-delay-${delay}`}>
      <div className="cc-glow" />
      {/* Show the Evidence ID [cite: 118] */}
      <div className="cc-id">EV-{evidenceId}</div> 
      <div className="cc-main">
        <div className="cc-title">{title}</div>
        <div className="cc-date">Filed: {date} &nbsp;·&nbsp; Dept: {department}</div>
      </div>
      <span className={`cc-status ${STATUS_CLASS[status] || "status-investigating"}`}>
        {status}
      </span>
      <button className="btn-gold sm" onClick={addRipple}>
        View →
      </button>
    </div>
  );
}