export interface ModuleDefinition {
  id: string;
  name: string;
  slug: string;
  description: string;
  pipelines: string[];
  navItems: NavItem[];
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

const moduleRegistry = new Map<string, ModuleDefinition>();

export function registerModule(module: ModuleDefinition): void {
  moduleRegistry.set(module.id, module);
}

export function getModule(id: string): ModuleDefinition | undefined {
  return moduleRegistry.get(id);
}

export function listModules(): ModuleDefinition[] {
  return Array.from(moduleRegistry.values());
}

// Register Local Growth Pipeline
registerModule({
  id: "local-growth",
  name: "Local Growth Pipeline",
  slug: "pipeline",
  description: "End-to-end lead generation for local businesses: research → demo site → outreach → close",
  pipelines: ["local-growth-full", "demo-only", "outreach-only"],
  navItems: [
    { label: "Pipeline", href: "/pipeline" },
    { label: "Leads", href: "/leads" },
    { label: "Workflows", href: "/workflows" },
  ],
});
