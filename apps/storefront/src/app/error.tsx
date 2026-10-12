"use client"

import { RefreshCw } from "lucide-react"
import { useEffect } from "react"
import { Button, ButtonLink } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/misc"

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container-ds">
      <EmptyState
        icon={<RefreshCw />}
        title="Something went wrong"
        description="We couldn't load this page. This is usually temporary - please try again in a moment."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <ButtonLink href="/" variant="secondary">
              Go home
            </ButtonLink>
          </div>
        }
      />
    </div>
  )
}
