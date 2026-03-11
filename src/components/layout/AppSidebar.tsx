import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
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
  { title: 'Vue Direction', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Vue Technique', href: '/dashboard/technical', icon: Shield },
  { title: 'Risques', href: '/risks', icon: AlertTriangle },
  { title: 'Conformité', href: '/compliance', icon: ClipboardCheck },
];

const operationsItems = [
  { title: 'Actifs', href: '/assets', icon: Server },
  { title: 'Documents', href: '/documents', icon: FileText },
  { title: 'Outils', href: '/tools', icon: Wrench },
  { title: 'Imports', href: '/runs', icon: Play },
  { title: 'Remédiation', href: '/tasks', icon: ListTodo },
];

const auditItems = [
  { title: 'Rapports', href: '/reports', icon: FileBarChart },
  { title: 'Report Studio', href: '/report-studio', icon: Wand2 },
  { title: 'Journal de Preuves', href: '/evidence', icon: BookOpen },
  { title: 'Proof Packs', href: '/proofs', icon: Package },
];

const adminItems = [
  { title: 'Paramètres', href: '/settings', icon: Settings },
  { title: 'Plans & Add-ons', href: '/plans', icon: CreditCard },
  { title: 'GO/NO-GO', href: '/go-no-go', icon: CheckSquare },
  { title: 'Admin Readiness', href: '/admin-readiness', icon: CheckSquare },
  { title: 'Test API', href: '/api-test', icon: FlaskConical },
];

export function AppSidebar() {
  const location = useLocation();
  const { organization, signOut, isAdmin, isAuditor } = useAuth();

  const isActive = (href: string) => location.pathname === href;

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-sidebar-primary" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">SENTINEL EDGE</h1>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
              {organization?.name ?? 'Chargement...'}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tableaux de bord</SidebarGroupLabel>
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
          <SidebarGroupLabel>Audit</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {auditItems.map((item) => (
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
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
