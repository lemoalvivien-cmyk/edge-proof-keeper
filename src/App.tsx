import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardTechnical from "./pages/DashboardTechnical";
import Authorizations from "./pages/Authorizations";
import NewAuthorization from "./pages/NewAuthorization";
import Assets from "./pages/Assets";
import Scans from "./pages/Scans";
import Documents from "./pages/Documents";
import Compliance from "./pages/Compliance";
import Evidence from "./pages/Evidence";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/technical" element={<ProtectedRoute><DashboardTechnical /></ProtectedRoute>} />
            <Route path="/authorizations" element={<ProtectedRoute><Authorizations /></ProtectedRoute>} />
            <Route path="/authorizations/new" element={<ProtectedRoute><NewAuthorization /></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
            <Route path="/scans" element={<ProtectedRoute><Scans /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
            <Route path="/evidence" element={<ProtectedRoute><Evidence /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredRoles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
