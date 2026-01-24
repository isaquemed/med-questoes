export function SkeletonLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded-lg ${className}`} />
  );
}

export function QuestionCardSkeleton() {
  return (
    <div className="space-y-6 p-8">
      <div className="space-y-2">
        <SkeletonLoader className="h-6 w-3/4" />
        <SkeletonLoader className="h-4 w-1/2" />
      </div>

      <div className="space-y-3">
        <SkeletonLoader className="h-4 w-full" />
        <SkeletonLoader className="h-4 w-full" />
        <SkeletonLoader className="h-4 w-3/4" />
      </div>

      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonLoader key={i} className="h-12 w-full" />
        ))}
      </div>

      <SkeletonLoader className="h-10 w-full" />
    </div>
  );
}

export function PerformanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLoader key={i} className="h-24" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SkeletonLoader className="h-80" />
        <SkeletonLoader className="h-80" />
      </div>
    </div>
  );
}
