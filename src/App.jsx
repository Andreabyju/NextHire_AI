import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ── Protected Route Guards ───────────────────────────────────────────────────
import {
  ProtectedRoute,
  AdminRoute,
  MentorRoute,
} from "./components/ProtectedRoute";

// ── Public Pages ─────────────────────────────────────────────────────────────
import LandingPage        from "./pages/frontend/LandingPage";
import SignInPage         from "./pages/frontend/SignInPage";
import SignUpPage         from "./pages/frontend/SignUpPage";
import ForgotPasswordPage from "./pages/frontend/ForgotPasswordPage";
import ResetPasswordPage  from "./pages/frontend/ResetPasswordPage";
import PortalSelectionPage from "./pages/frontend/PortalSelectionPage";
import MentorLogin        from "./pages/frontend/MentorLogin";
import MentorRegister     from "./pages/frontend/MentorRegister";
import AdminLogin         from "./pages/frontend/AdminLogin";

// ── Mentor Pages ─────────────────────────────────────────────────────────────
import MentorLayout         from "./pages/mentor/MentorLayout";
import MentorDashboard      from "./pages/mentor/MentorDashboard";
import MentorCandidates     from "./pages/mentor/MentorCandidates";
import MentorCandidateDetails from "./pages/mentor/MentorCandidateDetails";
import MentorSubscription   from "./pages/mentor/MentorSubscription";
import MentorProfile        from "./pages/mentor/MentorProfile";
import MentorJobs           from "./pages/mentor/MentorJobs";
import MentorShortlisted    from "./pages/mentor/MentorShortlisted";

// ── Admin Pages ──────────────────────────────────────────────────────────────
import AdminLayout          from "./pages/admin/AdminLayout";
import AdminDashboard       from "./pages/admin/AdminDashboard";
import AdminUsers           from "./pages/admin/AdminUsers";
import AdminMentors         from "./pages/admin/AdminMentors";
import AdminMentorDetails   from "./pages/admin/AdminMentorDetails";
import AdminActivities      from "./pages/admin/AdminActivities";

// ── Authenticated Pages ──────────────────────────────────────────────────────
import DashboardPage from "./pages/backend/DashboardPage";
import ResumeAnalyzerPage from "./pages/backend/ResumeAnalyzerPage";
import FaceAnalysisPage from "./pages/frontend/FaceAnalysisPage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================================================================
            PUBLIC PAGES
        ================================================================= */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/portal"
          element={<PortalSelectionPage />}
        />

        <Route
          path="/sign-in"
          element={<SignInPage />}
        />

        <Route
          path="/mentor/login"
          element={<MentorLogin />}
        />

        <Route
          path="/mentor/register"
          element={<MentorRegister />}
        />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/sign-up"
          element={<SignUpPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPasswordPage />}
        />


        {/* ================================================================
            USER DASHBOARD
        ================================================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />


        {/* ================================================================
            RESUME ANALYZER
        ================================================================= */}

        <Route
          path="/resume-analyzer"
          element={
            <ProtectedRoute>
              <ResumeAnalyzerPage />
            </ProtectedRoute>
          }
        />


        {/* ================================================================
            AI FACE ANALYSIS
        ================================================================= */}

        <Route
          path="/face-analysis"
          element={
            <ProtectedRoute>
              <FaceAnalysisPage />
            </ProtectedRoute>
          }
        />


        {/* ================================================================
            MENTOR DASHBOARD
        ================================================================= */}

        <Route
          path="/mentor"
          element={
            <MentorRoute>
              <MentorLayout />
            </MentorRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<MentorDashboard />} />
          <Route path="candidates" element={<MentorCandidates />} />
          <Route path="candidates/:id" element={<MentorCandidateDetails />} />
          <Route path="shortlisted" element={<MentorShortlisted />} />
          <Route path="subscription" element={<MentorSubscription />} />
          <Route path="jobs" element={<MentorJobs />} />
          <Route path="profile" element={<MentorProfile />} />
        </Route>


        {/* ================================================================
            ADMIN DASHBOARD
        ================================================================= */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="mentors" element={<AdminMentors />} />
          <Route path="mentors/:id" element={<AdminMentorDetails />} />
          <Route path="activity" element={<AdminActivities />} />
        </Route>


        {/* ================================================================
            FALLBACK
        ================================================================= */}

        <Route
          path="*"
          element={<LandingPage />}
        />

      </Routes>
    </BrowserRouter>
  );
}