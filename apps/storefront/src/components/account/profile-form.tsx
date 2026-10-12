"use client"

import type { HttpTypes } from "@medusajs/types"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/field"
import { Alert } from "@/components/ui/misc"
import { updateProfile, type FormState } from "@/lib/data/account-actions"

export function ProfileForm({ customer }: { customer: HttpTypes.StoreCustomer }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, null)
  const e = state?.fieldErrors ?? {}
  return (
    <form action={action} className="grid max-w-xl gap-4 sm:grid-cols-2" noValidate>
      <Input label="First name" name="first_name" required defaultValue={customer.first_name ?? ""} error={e.first_name} />
      <Input label="Last name" name="last_name" required defaultValue={customer.last_name ?? ""} error={e.last_name} />
      <Input wrapperClassName="sm:col-span-2" label="Email" name="email_display" type="email" value={customer.email} disabled readOnly hint="Contact us to change your email" />
      <Input wrapperClassName="sm:col-span-2" label="Mobile" name="phone" type="tel" defaultValue={customer.phone ?? ""} error={e.phone} />
      {state?.error ? <Alert className="sm:col-span-2">{state.error}</Alert> : null}
      {state?.success ? <Alert tone="success" className="sm:col-span-2">{state.success}</Alert> : null}
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending}>Save changes</Button>
      </div>
    </form>
  )
}
