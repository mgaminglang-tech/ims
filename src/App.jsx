import { Toaster } from "sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

import PageNotFound from "@/lib/PageNotFound";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import UserNotRegisteredError from "@/components/ui/UserNotRegisteredError";
import Layout from "@/components/ui/Layout";

import Dashboard from "@/pages/Dashboard";
import Assets from "@/pages/Assets";
import Search from "@/pages/Search";
import Forms from "@/pages/Forms";
import ImportExport from "@/pages/ImportExport";
import Documents from "@/pages/Documents";
import LoginPage from "@/pages/LoginPage";
import ForgotPassword from "@/pages/ForgotPassword";
const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-sky-50">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const {
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
  } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return <LoadingScreen />;
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();

  if (isLoadingAuth || isLoadingPublicSettings) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
  path="/forgot-password"
  element={
    <PublicRoute>
      <ForgotPassword />
    </PublicRoute>
  }
/>

      {/* Protected */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<Assets />} />
        <Route path="search" element={<Search />} />
        <Route path="forms" element={<Forms />} />
        <Route path="import-export" element={<ImportExport />} />
        <Route path="documents" element={<Documents />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster position="top-center" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;