import { Navigate } from "react-router-dom";
import { useAuth } from "./useAuth";

/**
 * Route guard that checks authentication and optionally role.
 * Usage: <ProtectedRoute role="Police"><PoliceDashboard /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, role }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", color: "var(--text-muted)" }}>
        Loading...
      </div>
    );
  }

  // Not authenticated — redirect to role selection / login
  if (!token || !user) {
    return <Navigate to="/role" replace />;
  }

  // Role mismatch — redirect to correct dashboard
  if (role && user.role !== role) {
    const roleRoutes = {
      Police: "/dashboard/police",
      Forensic: "/dashboard/forensic",
      Lawyer: "/dashboard/lawyer",
      Judge: "/dashboard/judge",
    };
    return <Navigate to={roleRoutes[user.role] || "/role"} replace />;
  }

  return children;
}
