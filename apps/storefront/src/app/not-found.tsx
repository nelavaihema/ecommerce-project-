import { ButtonLink } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/misc"

export default function NotFound() {
  return (
    <div className="container-ds">
      <EmptyState
        title="Page not found"
        description="The page you're looking for has moved, sold out or never existed."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/shop">Shop Now</ButtonLink>
            <ButtonLink href="/" variant="secondary">
              Go home
            </ButtonLink>
          </div>
        }
      />
    </div>
  )
}
