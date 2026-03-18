import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  FileText,
  ClipboardCheck,
  Settings,
  LogOut,
  BookOpen,
  Wrench,
  Play,
  FileBarChart,
  ListTodo,
  CheckSquare,
  Package,
  CreditCard,
  AlertTriangle,
  Wand2,
  FlaskConical,
  Gauge,
  Users,
  DollarSign,
  Database,
  Activity,
  Cpu,
  Brain,
  Shield,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const mainNavItems = [
  { title: 'Dashboard Immune', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Vue Technique', href: '/dashboard/technical', icon: Shield },
  { title: 'Risques Prédictifs', href: '/risks', icon: AlertTriangle },
  { title: 'Conformité NIS2', href: '/compliance', icon: ClipboardCheck },
];

const agentsItems = [
  { title: 'Agents IA Swarm', href: '/signals', icon: Brain },
  { title: 'Auto-Remédiation', href: '/remediation', icon: Wrench },
  { title: 'Tâches DSI', href: '/tasks', icon: CheckSquare },
  { title: 'GO/NO-GO', href: '/go-no-go', icon: CheckSquare },
];

const operationsItems = [
  { title: 'Actifs', href: '/assets', icon: Server },
  { title: 'Sources', href: '/sources', icon: Database },
  { title: 'Imports', href: '/runs', icon: Play },
  { title: 'Outils', href: '/tools', icon: Wrench },
  { title: 'Documents', href: '/documents', icon: FileText },
];

const vaultItems = [
  { title: 'Evidence Vault', href: '/evidence', icon: BookOpen },
  { title: 'Proof Packs', href: '/proofs', icon: Package },
  { title: 'Rapports', href: '/reports', icon: FileBarChart },
  { title: 'Report Studio', href: '/report-studio', icon: Wand2 },
];

const adminItems = [
  { title: 'Santé plateforme', href: '/platform-health', icon: Activity },
  { title: 'Paramètres', href: '/settings', icon: Settings },
  { title: 'Plans & Add-ons', href: '/plans', icon: CreditCard },
  { title: 'Revenue Settings', href: '/settings/revenue', icon: DollarSign },
  { title: 'Leads', href: '/admin/leads', icon: Users },
  { title: 'Codes d\'accès', href: '/admin/access-codes', icon: Shield },
  { title: 'Admin Readiness', href: '/admin-readiness', icon: Gauge },
  { title: 'Test API', href: '/api-test', icon: FlaskConical },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { organization, signOut, isAdmin, isAuditor } = useAuth();

  const isActive = (href: string) => location.pathname === href;

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
          </div>
          <div>
          <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">SECURIT-E</h1>
            <p className="text-[9px] font-mono text-primary/50 tracking-widest uppercase">Armure Cyber Autonome</p>
            <p className="text-xs text-muted-foreground truncate max-w-[150px] mt-0.5">
              {organization?.name ?? 'Chargement...'}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Immune Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isAuditor && (
          <SidebarGroup>
            <SidebarGroupLabel>Agents IA Swarm</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {agentsItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!isAuditor && (
          <SidebarGroup>
            <SidebarGroupLabel>Opérations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {operationsItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Evidence Vault</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vaultItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
                      <Link to={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="mb-2 px-2 py-1 rounded-lg bg-primary/8 border border-primary/15">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] font-mono text-primary/70 tracking-wider">5 AGENTS ACTIFS</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
