import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-9 w-20 mb-2" />
        <Skeleton className="h-5 w-24" />
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        {[120, 140, 180, 100].map((w, i) => (
          <Skeleton key={i} className={`h-6 rounded-full`} style={{ width: w }} />
        ))}
      </div>

      {/* Metrics grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <MetricCardSkeleton key={i} />)}
      </div>

      {/* Top findings card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 pb-2 border-b">
        {[200, 120, 80, 100, 80].map((w, i) => (
          <Skeleton key={i} className="h-4" style={{ width: w }} />
        ))}
      </div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {[200, 120, 80, 100, 80].map((w, j) => (
            <Skeleton key={j} className="h-4" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function OntologySkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-xl border border-border h-80 relative overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-xl" />
        {/* Fake nodes */}
        {[
          { top: '20%', left: '15%', w: 80, h: 32 },
          { top: '40%', left: '40%', w: 100, h: 32 },
          { top: '60%', left: '70%', w: 90, h: 32 },
          { top: '25%', left: '65%', w: 75, h: 32 },
          { top: '70%', left: '20%', w: 85, h: 32 },
        ].map((pos, i) => (
          <Skeleton
            key={i}
            className="absolute rounded-lg"
            style={{ top: pos.top, left: pos.left, width: pos.w, height: pos.h }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 space-y-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-56" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {[100, 120, 90].map((w, i) => (
          <Skeleton key={i} className="h-8 rounded" style={{ width: w }} />
        ))}
      </div>
      {/* Content */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" style={{ width: `${85 + Math.random() * 15}%` }} />
        ))}
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-4 pt-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
