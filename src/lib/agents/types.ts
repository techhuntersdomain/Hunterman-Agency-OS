import type { Json } from "@/types/database";

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
}

export interface AgentTask {
  id: string;
  agentId: string;
  input: Json;
  status: "queued" | "running" | "completed" | "failed";
  output?: Json;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}
