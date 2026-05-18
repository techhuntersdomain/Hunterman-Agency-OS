import type { AgentDefinition } from "./types";

const agentRegistry = new Map<string, AgentDefinition>();

export function registerAgent(agent: AgentDefinition): void {
  agentRegistry.set(agent.id, agent);
}

export function getAgent(id: string): AgentDefinition | undefined {
  return agentRegistry.get(id);
}

export function listAgents(): AgentDefinition[] {
  return Array.from(agentRegistry.values());
}

// Pipeline-specific agents to be implemented
export const AGENT_IDS = {
  BUSINESS_RESEARCHER: "business-researcher",
  SITE_GENERATOR: "site-generator",
  OUTREACH_WRITER: "outreach-writer",
  QUALITY_REVIEWER: "quality-reviewer",
} as const;
