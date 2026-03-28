import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./src/components/common/useAuth";
import { ParticleField } from "./src/components/common/Shared";
import ProtectedRoute from "./src/components/common/ProtectedRoute";

import Navbar          from "./src/components/common/Navbar";
import HomeSection     from "./src/components/common/HomeSection";
import RoleSelection   from "./src/components/common/RoleSelection";
import PoliceDashboard from "./src/components/police/PoliceDashboard";
import CaseDetails     from "./src/components/police/CaseDetails";

import LawyerDashboardPage   from "./src/components/lawyer/LawyerDashboardPage";
import LawyerCaseDetailsPage from "./src/components/lawyer/LawyerCaseDetailsPage";

import JudgeDashboardPage   from "./src/components/judge/JudgeDashboardPage";
import JudgeCaseDetailsPage from "./src/components/judge/JudgeCaseDetailsPage";

import ForensicDashboardPage   from "./src/components/forensic/ForensicDashboardPage";
import ForensicCaseDetailsPage from "./src/components/forensic/ForensicCaseDetailsPage";

import CrossCasePopup from "./src/components/common/CrossCasePopup";

import "./App.css";

const LandingPage = () => (
  <>
    <HomeSection />
    <footer className="footer">
      <p>© 2025 Honora · Federal Evidence Management System · All Rights Reserved</p>
      <p className="footer-sub">Authorized Personnel Only · Unauthorized Access is a Federal Offense</p>
    </footer>
  </>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ParticleField />
        <Navbar />
        <CrossCasePopup />
        <Routes>
          <Route path="/"                          element={<LandingPage />} />
          <Route path="/role"                      element={<RoleSelection />} />

          <Route path="/dashboard/police"          element={<ProtectedRoute role="Police"><PoliceDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/police/case/:id" element={<ProtectedRoute role="Police"><CaseDetails /></ProtectedRoute>} />

          <Route path="/dashboard/lawyer"          element={<ProtectedRoute role="Lawyer"><LawyerDashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/lawyer/case/:id" element={<ProtectedRoute role="Lawyer"><LawyerCaseDetailsPage /></ProtectedRoute>} />

          <Route path="/dashboard/judge"           element={<ProtectedRoute role="Judge"><JudgeDashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/judge/case/:id"  element={<ProtectedRoute role="Judge"><JudgeCaseDetailsPage /></ProtectedRoute>} />

          <Route path="/dashboard/forensic"           element={<ProtectedRoute role="Forensic"><ForensicDashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/forensic/case/:id"  element={<ProtectedRoute role="Forensic"><ForensicCaseDetailsPage /></ProtectedRoute>} />

          <Route path="*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}