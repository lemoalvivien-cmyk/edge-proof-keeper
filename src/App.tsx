import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import ScopeGuard from "./pages/ScopeGuard";
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
import Tools from "./pages/Tools";
import ToolDetail from "./pages/ToolDetail";
import Runs from "./pages/Runs";
import RunDetail from "./pages/RunDetail";
import Reports from "./pages/Reports";
import Tasks from "./pages/Tasks";
import TaskDetail from "./pages/TaskDetail";
import GoNoGo from "./pages/GoNoGo";
import Proofs from "./pages/Proofs";
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
            {/* Public landing pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/scopeguard" element={<ScopeGuard />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected app routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/dashboard/technical" element={<ProtectedRoute><DashboardTechnical /></ProtectedRoute>} />
            <Route path="/authorizations" element={<ProtectedRoute><Authorizations /></ProtectedRoute>} />
            <Route path="/authorization/new" element={<ProtectedRoute><NewAuthorization /></ProtectedRoute>} />
            <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
            <Route path="/scans" element={<ProtectedRoute><Scans /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
            <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
            <Route path="/evidence" element={<ProtectedRoute><Evidence /></ProtectedRoute>} />
            <Route path="/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
            <Route path="/tools/:slug" element={<ProtectedRoute><ToolDetail /></ProtectedRoute>} />
            <Route path="/runs" element={<ProtectedRoute><Runs /></ProtectedRoute>} />
            <Route path="/runs/:id" element={<ProtectedRoute><RunDetail /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
            <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requiredRoles={['admin']}><Settings /></ProtectedRoute>} />
            <Route path="/go-no-go" element={<ProtectedRoute requiredRoles={['admin']}><GoNoGo /></ProtectedRoute>} />
            <Route path="/proofs" element={<ProtectedRoute><Proofs /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
