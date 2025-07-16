import { SearchPage } from '@/components/search-page'
import { Suspense } from 'react'

function SearchFallback() {
  return (
    <div className="relative min-h-screen px-4 py-8 max-w-full overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
        </div>
        <div className="max-w-2xl mb-8">
          <div className="h-12 bg-muted animate-pulse rounded" />
        </div>
        <div className="text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-muted border-t-foreground rounded-full mx-auto mb-4"></div>
          <p className="text-foreground text-lg">Loading...</p>
        </div>
      </div>
    </div>
  )
}

export default function Search() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPage />
    </Suspense>
  )
}
