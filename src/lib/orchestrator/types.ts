import type { Json } from "@/types/database";

export interface PipelineStep {
  id: string;
  name: string;
  agentId?: string;
  execute: (context: StepContext) => Promise<StepResult>;
  rollback?: (context: StepContext) => Promise<void>;
}

export interface StepContext {
  workflowId: string;
  leadId?: string;
  previousResults: Map<string, StepResult>;
  metadata: Record<string, Json>;
}

export interface StepResult {
  success: boolean;
  data?: Json;
  error?: string;
  nextStep?: string; // Override default linear flow
}

export interface PipelineDefinition {
  id: string;
  name: string;
  moduleId: string;
  steps: PipelineStep[];
  onError?: "stop" | "skip" | "retry";
  maxRetries?: number;
}
