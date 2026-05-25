import { getLeads } from "@/lib/leads";
import { PipelineBoard } from "./pipeline-board";

// Read live from Supabase on every request.
export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { data, error } = await getLeads();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Local Growth Pipeline
        </h2>
        <p className="text-muted-foreground mt-1">
          {error
            ? "Lead pipeline by stage"
            : `${data.length} lead${data.length !== 1 ? "s" : ""} across the pipeline — drag-free: change a card's status to move it`}
        </p>
      </div>

      <PipelineBoard leads={data} loadError={error} />
    </div>
  );
}
