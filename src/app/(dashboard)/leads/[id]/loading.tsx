import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LeadDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-24 rounded bg-muted animate-pulse" />
      <div className="h-8 w-64 rounded bg-muted animate-pulse" />
      <Card>
        <CardHeader>
          <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
