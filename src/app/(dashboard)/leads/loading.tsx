import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LeadsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leads</h2>
          <p className="text-muted-foreground mt-1">Manage local business leads</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="h-8 w-full max-w-sm rounded-lg bg-muted animate-pulse" />
        <div className="h-8 w-[180px] rounded-lg bg-muted animate-pulse" />
      </div>

      <Card>
        <CardHeader>
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded bg-muted animate-pulse" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
