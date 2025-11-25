// src/app/(app)/loading.tsx

export default function Loading() {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
            <div className="h-6 w-48 rounded-lg bg-muted/60 animate-pulse" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-muted animate-pulse" />
        </div>
  
        {/* Filter Bar Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse flex-shrink-0" />
          ))}
        </div>
  
        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Main Columns */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
             {[1, 2, 3].map((col) => (
               <div key={col} className="space-y-4">
                  <div className="flex justify-between items-center">
                      <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-6 w-8 bg-muted rounded-full animate-pulse" />
                  </div>
                  {/* Cards */}
                  {[1, 2].map((card) => (
                      <div key={card} className="h-32 w-full rounded-xl border border-border bg-card p-4 space-y-3">
                          <div className="flex justify-between">
                              <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
                              <div className="flex-1 ml-3 space-y-2">
                                  <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                                  <div className="h-4 w-1/2 bg-muted/50 rounded animate-pulse" />
                              </div>
                              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                          </div>
                      </div>
                  ))}
               </div>
             ))}
          </div>
  
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1 h-64 rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="h-8 w-1/2 bg-muted rounded animate-pulse mb-6" />
              {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-6 w-8 bg-muted rounded-full animate-pulse" />
                  </div>
              ))}
          </div>
        </div>
      </div>
    )
  }