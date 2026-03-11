import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OwnerSetup } from "@/components/auth/OwnerSetup";
import { useSoloAuth } from "@/hooks/useSoloAuth";
import { SOLO_MODE } from "@/config/app";
import { Loader2 } from "lucide-react";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import DashboardTechnical from "./pages/DashboardTechnical";
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
import ApiTest from "./pages/ApiTest";
import ReportStudio from "./pages/ReportStudio";
import AdminReadiness from "./pages/AdminReadiness";
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
import Demo from "./pages/Demo";

const queryClient = new QueryClient();

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
              <Route path="/demo" element={<Demo />} />
              
              {/* Auth route - redirect to dashboard in SOLO_MODE */}
              <Route path="/auth" element={SOLO_MODE ? <Navigate to="/dashboard" replace /> : <Auth />} />
              
              {/* Compatibility redirects for removed authorization module */}
              <Route path="/scopeguard" element={<Navigate to="/tools" replace />} />
              <Route path="/authorizations" element={<Navigate to="/tools" replace />} />
              <Route path="/authorizations/*" element={<Navigate to="/tools" replace />} />
              
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
              
              {/* Onboarding */}
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              
              {/* Settings - admin only */}
              <Route path="/settings" element={<ProtectedRoute requiredRoles={['admin']}><Settings /></ProtectedRoute>} />
              <Route path="/plans" element={<ProtectedRoute requiredRoles={['admin']}><PlansAddons /></ProtectedRoute>} />
              
              {/* Protected app routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/technical" element={<ProtectedRoute><DashboardTechnical /></ProtectedRoute>} />
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
              <Route path="/report-studio" element={<ProtectedRoute><ReportStudio /></ProtectedRoute>} />
              <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
              <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
              <Route path="/go-no-go" element={<ProtectedRoute requiredRoles={['admin']}><GoNoGo /></ProtectedRoute>} />
              <Route path="/proofs" element={<ProtectedRoute><Proofs /></ProtectedRoute>} />
              <Route path="/risks" element={<ProtectedRoute><Risks /></ProtectedRoute>} />
              <Route path="/findings" element={<ProtectedRoute><Findings /></ProtectedRoute>} />
              <Route path="/api-test" element={<ProtectedRoute><ApiTest /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SoloModeWrapper>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;