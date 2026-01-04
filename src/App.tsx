import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider, DemoBanner } from "@/contexts/DemoContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthorizationGate } from "@/components/auth/AuthorizationGate";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import ScopeGuard from "./pages/ScopeGuard";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
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
// Legal pages
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import AuthorizedUse from "./pages/legal/AuthorizedUse";
import Disclaimer from "./pages/legal/Disclaimer";

const queryClient = new QueryClient();

// Wrapper combining ProtectedRoute + AuthorizationGate
function ProtectedWithGate({ children, requiredRoles }: { children: React.ReactNode; requiredRoles?: ('admin' | 'auditor' | 'user')[] }) {
  return (
    <ProtectedRoute requiredRoles={requiredRoles}>
      <AuthorizationGate>
        {children}
      </AuthorizationGate>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DemoProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <DemoBanner />
            <Routes>
              {/* Public landing pages */}
              <Route path="/" element={<Landing />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/scopeguard" element={<ScopeGuard />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Legal pages (public) */}
              <Route path="/legal/terms" element={<Terms />} />
              <Route path="/legal/privacy" element={<Privacy />} />
              <Route path="/legal/authorized-use" element={<AuthorizedUse />} />
              <Route path="/legal/disclaimer" element={<Disclaimer />} />
              
              {/* Onboarding - protected but exempt from authorization gate */}
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              
              {/* Authorization routes - protected but exempt from authorization gate */}
              <Route path="/authorizations" element={<ProtectedRoute><Authorizations /></ProtectedRoute>} />
              <Route path="/authorization/new" element={<ProtectedRoute><NewAuthorization /></ProtectedRoute>} />
              
              {/* Settings - protected, admin only, exempt from authorization gate */}
              <Route path="/settings" element={<ProtectedRoute requiredRoles={['admin']}><Settings /></ProtectedRoute>} />
              
              {/* Protected app routes - require valid authorization */}
              <Route path="/dashboard" element={<ProtectedWithGate><Dashboard /></ProtectedWithGate>} />
              <Route path="/dashboard/technical" element={<ProtectedWithGate><DashboardTechnical /></ProtectedWithGate>} />
              <Route path="/assets" element={<ProtectedWithGate><Assets /></ProtectedWithGate>} />
              <Route path="/scans" element={<ProtectedWithGate><Scans /></ProtectedWithGate>} />
              <Route path="/documents" element={<ProtectedWithGate><Documents /></ProtectedWithGate>} />
              <Route path="/compliance" element={<ProtectedWithGate><Compliance /></ProtectedWithGate>} />
              <Route path="/evidence" element={<ProtectedWithGate><Evidence /></ProtectedWithGate>} />
              <Route path="/tools" element={<ProtectedWithGate><Tools /></ProtectedWithGate>} />
              <Route path="/tools/:slug" element={<ProtectedWithGate><ToolDetail /></ProtectedWithGate>} />
              <Route path="/runs" element={<ProtectedWithGate><Runs /></ProtectedWithGate>} />
              <Route path="/runs/:id" element={<ProtectedWithGate><RunDetail /></ProtectedWithGate>} />
              <Route path="/reports" element={<ProtectedWithGate><Reports /></ProtectedWithGate>} />
              <Route path="/tasks" element={<ProtectedWithGate><Tasks /></ProtectedWithGate>} />
              <Route path="/tasks/:id" element={<ProtectedWithGate><TaskDetail /></ProtectedWithGate>} />
              <Route path="/go-no-go" element={<ProtectedWithGate requiredRoles={['admin']}><GoNoGo /></ProtectedWithGate>} />
              <Route path="/proofs" element={<ProtectedWithGate><Proofs /></ProtectedWithGate>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </DemoProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
