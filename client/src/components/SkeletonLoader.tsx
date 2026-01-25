import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

export function QuestionCardSkeleton() {
  return (
    <Card className="p-8 space-y-6 border-t-4 border-t-gray-200">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-3 pt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 w-full rounded-xl mt-6" />
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex justify-between mb-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-3 w-24 mt-2" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8">
          <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="h-[300px] w-full" />
        </Card>
        <div className="space-y-8">
          <Card className="p-8 h-48">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
          <Card className="p-8 h-48">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function FilterSkeleton() {
  return (
    <Card className="p-8 shadow-xl">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Skeleton className="h-14 w-64 rounded-xl" />
      </div>
    </Card>
  );
}
