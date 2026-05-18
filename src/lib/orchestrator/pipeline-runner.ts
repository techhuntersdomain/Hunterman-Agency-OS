import type { PipelineDefinition, StepContext, StepResult } from "./types";

export class PipelineRunner {
  private pipeline: PipelineDefinition;

  constructor(pipeline: PipelineDefinition) {
    this.pipeline = pipeline;
  }

  async execute(initialContext: Omit<StepContext, "previousResults">): Promise<{
    success: boolean;
    results: Map<string, StepResult>;
    failedStep?: string;
  }> {
    const results = new Map<string, StepResult>();
    const context: StepContext = {
      ...initialContext,
      previousResults: results,
    };

    for (const step of this.pipeline.steps) {
      try {
        const result = await step.execute(context);
        results.set(step.id, result);

        if (!result.success) {
          if (this.pipeline.onError === "stop") {
            return { success: false, results, failedStep: step.id };
          }
          // "skip" continues to next step
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        results.set(step.id, { success: false, error: errorMessage });

        if (this.pipeline.onError !== "skip") {
          return { success: false, results, failedStep: step.id };
        }
      }
    }

    return { success: true, results };
  }
}
