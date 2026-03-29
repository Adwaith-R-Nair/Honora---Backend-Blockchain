// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getStatusBadgeClass(status) {
  const map = {
    "Open":               "badge-open",
    "Trial":              "badge-trial",
    "Hearing":            "badge-hearing",
    "Closed":             "badge-closed",
    "Under Investigation":"badge-investigation",
  };
  return map[status] || "badge-closed";
}
