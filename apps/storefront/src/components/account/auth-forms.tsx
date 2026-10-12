"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { Alert } from "@/components/ui/misc"
import { login, register, type FormState } from "@/lib/data/account-actions"

export function LoginForm({ redirectTo, reason }: { redirectTo?: string; reason?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, null)
  return (
    <form action={action} className="space-y-4" noValidate>
      {reason === "wishlist" ? <Alert tone="info">Sign in to save items to your wishlist.</Alert> : null}
      {reason === "checkout" ? <Alert tone="info">Sign in or create an account before adding your checkout address.</Alert> : null}
      <input type="hidden" name="redirect" value={redirectTo ?? "/account"} />
      <Input label="Email" name="email" type="email" autoComplete="email" required error={state?.fieldErrors?.email} />
      <Input label="Password" name="password" type="password" autoComplete="current-password" required error={state?.fieldErrors?.password} />
      {state?.error ? <Alert>{state.error}</Alert> : null}
      <Button type="submit" size="lg" fullWidth loading={pending}>
        Sign in
      </Button>
      <p className="text-center text-sm text-ash">
        New to DS Wardrobe?{" "}
        <Link href={`/account/register${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} className="link-underline font-semibold text-ink">
          Create an account
        </Link>
      </p>
    </form>
  )
}

export function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(register, null)
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <input type="hidden" name="redirect" value={redirectTo ?? "/account"} />
      <Input label="First name" name="first_name" autoComplete="given-name" required error={state?.fieldErrors?.first_name} />
      <Input label="Last name" name="last_name" autoComplete="family-name" required error={state?.fieldErrors?.last_name} />
      <Input wrapperClassName="sm:col-span-2" label="Email" name="email" type="email" autoComplete="email" required error={state?.fieldErrors?.email} />
      <Input wrapperClassName="sm:col-span-2" label="Mobile (optional)" name="phone" type="tel" autoComplete="tel" error={state?.fieldErrors?.phone} />
      <Input wrapperClassName="sm:col-span-2" label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters" error={state?.fieldErrors?.password} />
      {state?.error ? <Alert className="sm:col-span-2">{state.error}</Alert> : null}
      <div className="sm:col-span-2">
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Create account
        </Button>
        <p className="mt-4 text-center text-sm text-ash">
          Already have an account?{" "}
          <Link href={`/account/login${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`} className="link-underline font-semibold text-ink">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  )
}
