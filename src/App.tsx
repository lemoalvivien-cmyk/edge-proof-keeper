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
import { Suspense, lazy } from "react";
import { useNetworkStatus } from "./hooks/useNetworkStatus";

// ── Eagerly loaded public/auth pages (small, needed immediately) ──
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// ── Lazily loaded pages (code splitting) ──
const Pricing = lazy(() => import("./pages/Pricing"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Status = lazy(() => import("./pages/Status"));
const Demo = lazy(() => import("./pages/Demo"));

// Legal
const Terms = lazy(() => import("./pages/legal/Terms"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const AuthorizedUse = lazy(() => import("./pages/legal/AuthorizedUse"));
const Disclaimer = lazy(() => import("./pages/legal/Disclaimer"));

// Offres
const ImportsHub = lazy(() => import("./pages/offres/ImportsHub"));
const DevsecOpsPack = lazy(() => import("./pages/offres/DevsecOpsPack"));
const AuditPackCabinets = lazy(() => import("./pages/offres/AuditPackCabinets"));
const RemediationPatchBridge = lazy(() => import("./pages/offres/RemediationPatchBridge"));
const ContinuousGovernance = lazy(() => import("./pages/offres/ContinuousGovernance"));
const EasmOsintSignals = lazy(() => import("./pages/offres/EasmOsintSignals"));

// Onboarding
const Onboarding = lazy(() => import("./pages/Onboarding"));

// Protected app pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardTechnical = lazy(() => import("./pages/DashboardTechnical"));
const Assets = lazy(() => import("./pages/Assets"));
const Scans = lazy(() => import("./pages/Scans"));
const Documents = lazy(() => import("./pages/Documents"));
const Compliance = lazy(() => import("./pages/Compliance"));
const Evidence = lazy(() => import("./pages/Evidence"));
const Settings = lazy(() => import("./pages/Settings"));
const Tools = lazy(() => import("./pages/Tools"));
const ToolDetail = lazy(() => import("./pages/ToolDetail"));
const Runs = lazy(() => import("./pages/Runs"));
const RunDetail = lazy(() => import("./pages/RunDetail"));
const Reports = lazy(() => import("./pages/Reports"));
const ReportStudio = lazy(() => import("./pages/ReportStudio"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskDetail = lazy(() => import("./pages/TaskDetail"));
const GoNoGo = lazy(() => import("./pages/GoNoGo"));
const Proofs = lazy(() => import("./pages/Proofs"));
const Risks = lazy(() => import("./pages/Risks"));
const Findings = lazy(() => import("./pages/Findings"));
const Remediation = lazy(() => import("./pages/Remediation"));
const Sources = lazy(() => import("./pages/Sources"));
const Signals = lazy(() => import("./pages/Signals"));
const PlansAddons = lazy(() => import("./pages/PlansAddons"));
const RevenueSettings = lazy(() => import("./pages/RevenueSettings"));
const PlatformHealth = lazy(() => import("./pages/PlatformHealth"));
const AdminReadiness = lazy(() => import("./pages/AdminReadiness"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));
const ExecutiveCockpit = lazy(() => import("./pages/ExecutiveCockpit"));
const AdminAccessCodes = lazy(() => import("./pages/AdminAccessCodes"));
const ApiTest = lazy(() => import("./pages/ApiTest"));
const Activate = lazy(() => import("./pages/Activate"));

const queryClient = new QueryClient();

// Full-screen fallback shown while lazy chunks load
function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

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
              <Suspense fallback={<PageLoader />}>
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
                  <Route path="/admin/access-codes" element={<ProtectedRoute requiredRoles={['admin']}><AdminAccessCodes /></ProtectedRoute>} />
                  <Route path="/settings/revenue" element={<ProtectedRoute requiredRoles={['admin']}><RevenueSettings /></ProtectedRoute>} />

                  {/* Activate premium access code — requires auth, no paywall */}
                  <Route path="/activate" element={<ProtectedRoute><Activate /></ProtectedRoute>} />

                  {/* Protected + paywalled app routes */}
                  <Route path="/executive" element={<ProtectedRoute><PaywallGate><ExecutiveCockpit /></PaywallGate></ProtectedRoute>} />
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
              </Suspense>
            </SoloModeWrapper>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
