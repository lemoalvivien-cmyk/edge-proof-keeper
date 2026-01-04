import React, { createContext, useContext, useState, useEffect } from "react";

interface DemoContextType {
  isDemoMode: boolean;
  demoData: DemoData | null;
}

interface DemoData {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  toolRun: {
    id: string;
    tool_name: string;
    status: string;
    created_at: string;
  };
  report: {
    id: string;
    status: string;
  };
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
  proofPack: {
    id: string;
    pack_hash: string;
    status: string;
  };
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// Check if demo mode is enabled via env var
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

// Demo seed data
const DEMO_SEED: DemoData = {
  organization: {
    id: "demo-org-001",
    name: "Démo Entreprise SAS",
    slug: "demo-entreprise",
  },
  toolRun: {
    id: "demo-run-001",
    tool_name: "nuclei",
    status: "completed",
    created_at: new Date().toISOString(),
  },
  report: {
    id: "demo-report-001",
    status: "ready",
  },
  findings: [
    {
      id: "demo-finding-001",
      title: "SSL Certificate Expiring Soon",
      severity: "medium",
      status: "open",
    },
    {
      id: "demo-finding-002",
      title: "Missing Security Headers",
      severity: "low",
      status: "open",
    },
    {
      id: "demo-finding-003",
      title: "Outdated WordPress Version",
      severity: "high",
      status: "in_progress",
    },
    {
      id: "demo-finding-004",
      title: "Open Port 22 (SSH)",
      severity: "info",
      status: "open",
    },
    {
      id: "demo-finding-005",
      title: "Directory Listing Enabled",
      severity: "medium",
      status: "fixed",
    },
  ],
  tasks: [
    {
      id: "demo-task-001",
      title: "Renouveler le certificat SSL",
      status: "open",
      priority: "high",
    },
    {
      id: "demo-task-002",
      title: "Ajouter les headers de sécurité",
      status: "in_progress",
      priority: "medium",
    },
  ],
  proofPack: {
    id: "demo-pack-001",
    pack_hash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0",
    status: "ready",
  },
};

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [demoData, setDemoData] = useState<DemoData | null>(null);

  useEffect(() => {
    if (DEMO_MODE) {
      setDemoData(DEMO_SEED);
    }
  }, []);

  return (
    <DemoContext.Provider value={{ isDemoMode: DEMO_MODE, demoData }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}

// Demo mode banner component
export function DemoBanner() {
  const { isDemoMode } = useDemo();

  if (!isDemoMode) return null;

  return (
    <div className="bg-yellow-500 text-yellow-950 text-center py-2 px-4 font-medium text-sm">
      🎭 MODE DÉMO — Données fictives pour présentation
    </div>
  );
}
