'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App Error:', error)
  }, [error])

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Oops, something went wrong!</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          {error.message || "We encountered an unexpected error. Don't worry, your data is safe."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => reset()}
          variant="default"
        >
          Try Again
        </Button>
        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
        >
          Back to Home
        </Button>
      </div>
    </div>
  )
}