import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthorizationGate } from "@/components/auth/AuthorizationGate";
import { OwnerSetup } from "@/components/auth/OwnerSetup";
import { useSoloAuth } from "@/hooks/useSoloAuth";
import { SOLO_MODE } from "@/config/app";
import { Loader2 } from "lucide-react";
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
import Risks from "./pages/Risks";
import Findings from "./pages/Findings";
import NotFound from "./pages/NotFound";
// Legal pages
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import AuthorizedUse from "./pages/legal/AuthorizedUse";
import Disclaimer from "./pages/legal/Disclaimer";
// Offres pages
import ImportsHub from "./pages/offres/ImportsHub";
import DevsecOpsPack from "./pages/offres/DevsecOpsPack";
import AuditPackCabinets from "./pages/offres/AuditPackCabinets";
import RemediationPatchBridge from "./pages/offres/RemediationPatchBridge";
import ContinuousGovernance from "./pages/offres/ContinuousGovernance";
import EasmOsintSignals from "./pages/offres/EasmOsintSignals";
import PlansAddons from "./pages/PlansAddons";

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

// Solo mode wrapper that handles auto-session
function SoloModeWrapper({ children }: { children: React.ReactNode }) {
  const { state, onSetupComplete, isSoloMode } = useSoloAuth();

  if (!isSoloMode) {
    return <>{children}</>;
  }

  if (state === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === 'needs_setup') {
    return <OwnerSetup onComplete={onSetupComplete} />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SoloModeWrapper>
            <Routes>
              {/* Public landing pages */}
              <Route path="/" element={<Landing />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/scopeguard" element={<ScopeGuard />} />
              
              {/* Auth route - redirect to dashboard in SOLO_MODE */}
              <Route path="/auth" element={SOLO_MODE ? <Navigate to="/dashboard" replace /> : <Auth />} />
              
              {/* Offres pages (public) */}
              <Route path="/offres/imports-hub" element={<ImportsHub />} />
              <Route path="/offres/devsecops-pack" element={<DevsecOpsPack />} />
              <Route path="/offres/audit-pack-cabinets" element={<AuditPackCabinets />} />
              <Route path="/offres/remediation-patch-bridge" element={<RemediationPatchBridge />} />
              <Route path="/offres/continuous-governance" element={<ContinuousGovernance />} />
              <Route path="/offres/easm-osint-signals" element={<EasmOsintSignals />} />
              
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
              <Route path="/plans" element={<ProtectedRoute requiredRoles={['admin']}><PlansAddons /></ProtectedRoute>} />
              
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
              <Route path="/risks" element={<ProtectedWithGate><Risks /></ProtectedWithGate>} />
              <Route path="/findings" element={<ProtectedWithGate><Findings /></ProtectedWithGate>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SoloModeWrapper>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
