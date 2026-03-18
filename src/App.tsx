import { Toaster } from "@/components/ui/toaster";
import { NavbarHomeButton } from "@/components/NavbarHomeButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PaywallGate } from "@/components/auth/PaywallGate";
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
import AdminLeads from "./pages/AdminLeads";
// Legal pages
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";
import AuthorizedUse from "./pages/legal/AuthorizedUse";
import Disclaimer from "./pages/legal/Disclaimer";
// Offres pages (commercial landing pages — linked from footer)
import ImportsHub from "./pages/offres/ImportsHub";
import DevsecOpsPack from "./pages/offres/DevsecOpsPack";
import AuditPackCabinets from "./pages/offres/AuditPackCabinets";
import RemediationPatchBridge from "./pages/offres/RemediationPatchBridge";
import ContinuousGovernance from "./pages/offres/ContinuousGovernance";
import EasmOsintSignals from "./pages/offres/EasmOsintSignals";
import PlansAddons from "./pages/PlansAddons";
import Demo from "./pages/Demo";
import ResetPassword from "./pages/ResetPassword";
import Sources from "./pages/Sources";
import Signals from "./pages/Signals";
import RevenueSettings from "./pages/RevenueSettings";
import Remediation from "./pages/Remediation";
import PlatformHealth from "./pages/PlatformHealth";
import FAQ from "./pages/FAQ";
import Status from "./pages/Status";
import { useNetworkStatus } from "./hooks/useNetworkStatus";

const queryClient = new QueryClient();

// Global network status monitor
function NetworkMonitor() {
  useNetworkStatus();
  return null;
}

// SoloModeWrapper: only active when VITE_SOLO_MODE=true.
// In public SaaS mode (default), this is a transparent pass-through.
function SoloModeWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, isSoloMode } = useSoloAuth();

  if (!isSoloMode) {
    return <>{children}</>;
  }

  const handleSetupComplete = () => {
    navigate('/admin-readiness', { replace: true });
  };

  if (state === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === 'needs_setup') {
    return <OwnerSetup onComplete={handleSetupComplete} />;
  }

  if (state === 'authenticated' && location.pathname === '/') {
    navigate('/admin-readiness', { replace: true });
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <NetworkMonitor />
            <SoloModeWrapper>
              <NavbarHomeButton />
              <Routes>
                {/* Public landing pages */}
                <Route path="/" element={<Landing />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/status" element={<Status />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/demo" element={<Demo />} />
                
                {/* Auth route — public in SaaS mode, redirect in solo mode */}
                <Route path="/auth" element={SOLO_MODE ? <Navigate to="/dashboard" replace /> : <Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* Compatibility redirects for removed authorization module */}
                <Route path="/scopeguard" element={<Navigate to="/tools" replace />} />
                <Route path="/authorizations" element={<Navigate to="/tools" replace />} />
                <Route path="/authorizations/*" element={<Navigate to="/tools" replace />} />
                
                {/* Offres pages (public — landing commerciales) */}
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
                <Route path="/admin-readiness" element={<ProtectedRoute requiredRoles={['admin']}><AdminReadiness /></ProtectedRoute>} />
                <Route path="/admin/leads" element={<ProtectedRoute requiredRoles={['admin']}><AdminLeads /></ProtectedRoute>} />
                <Route path="/settings/revenue" element={<ProtectedRoute requiredRoles={['admin']}><RevenueSettings /></ProtectedRoute>} />
                
                {/* Protected + paywalled app routes */}
                <Route path="/dashboard" element={<ProtectedRoute><PaywallGate><Dashboard /></PaywallGate></ProtectedRoute>} />
                <Route path="/dashboard/technical" element={<ProtectedRoute><PaywallGate><DashboardTechnical /></PaywallGate></ProtectedRoute>} />
                <Route path="/assets" element={<ProtectedRoute><PaywallGate><Assets /></PaywallGate></ProtectedRoute>} />
                <Route path="/scans" element={<ProtectedRoute><PaywallGate><Scans /></PaywallGate></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute><PaywallGate><Documents /></PaywallGate></ProtectedRoute>} />
                <Route path="/compliance" element={<ProtectedRoute><PaywallGate><Compliance /></PaywallGate></ProtectedRoute>} />
                <Route path="/evidence" element={<ProtectedRoute><PaywallGate><Evidence /></PaywallGate></ProtectedRoute>} />
                <Route path="/tools" element={<ProtectedRoute><PaywallGate><Tools /></PaywallGate></ProtectedRoute>} />
                <Route path="/tools/:slug" element={<ProtectedRoute><PaywallGate><ToolDetail /></PaywallGate></ProtectedRoute>} />
                <Route path="/runs" element={<ProtectedRoute><PaywallGate><Runs /></PaywallGate></ProtectedRoute>} />
                <Route path="/runs/:id" element={<ProtectedRoute><PaywallGate><RunDetail /></PaywallGate></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><PaywallGate><Reports /></PaywallGate></ProtectedRoute>} />
                <Route path="/report-studio" element={<ProtectedRoute><PaywallGate><ReportStudio /></PaywallGate></ProtectedRoute>} />
                <Route path="/tasks" element={<ProtectedRoute><PaywallGate><Tasks /></PaywallGate></ProtectedRoute>} />
                <Route path="/tasks/:id" element={<ProtectedRoute><PaywallGate><TaskDetail /></PaywallGate></ProtectedRoute>} />
                <Route path="/go-no-go" element={<ProtectedRoute requiredRoles={['admin']}><PaywallGate><GoNoGo /></PaywallGate></ProtectedRoute>} />
                <Route path="/proofs" element={<ProtectedRoute><PaywallGate><Proofs /></PaywallGate></ProtectedRoute>} />
                <Route path="/risks" element={<ProtectedRoute><PaywallGate><Risks /></PaywallGate></ProtectedRoute>} />
                <Route path="/remediation" element={<ProtectedRoute><PaywallGate><Remediation /></PaywallGate></ProtectedRoute>} />
                <Route path="/findings" element={<ProtectedRoute><PaywallGate><Findings /></PaywallGate></ProtectedRoute>} />
                <Route path="/sources" element={<ProtectedRoute><PaywallGate><Sources /></PaywallGate></ProtectedRoute>} />
                <Route path="/signals" element={<ProtectedRoute><PaywallGate><Signals /></PaywallGate></ProtectedRoute>} />
                {/* /api-test — accessible en développement uniquement */}
                {import.meta.env.DEV && (
                  <Route path="/api-test" element={<ProtectedRoute><ApiTest /></ProtectedRoute>} />
                )}
                {!import.meta.env.DEV && (
                  <Route path="/api-test" element={<Navigate to="/dashboard" replace />} />
                )}
                <Route path="/platform-health" element={<ProtectedRoute><PaywallGate><PlatformHealth /></PaywallGate></ProtectedRoute>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SoloModeWrapper>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
