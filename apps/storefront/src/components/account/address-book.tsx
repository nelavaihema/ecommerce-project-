"use client"

import type { HttpTypes } from "@medusajs/types"
import { MapPin, Plus } from "lucide-react"
import { useActionState, useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input, Select } from "@/components/ui/field"
import { Alert, Badge, EmptyState } from "@/components/ui/misc"
import { deleteAddress, saveAddress, type FormState } from "@/lib/data/account-actions"
import { INDIAN_STATES } from "@/lib/util/size-guides"

function AddressForm({ address, onDone }: { address?: HttpTypes.StoreCustomerAddress; onDone: () => void }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveAddress, null)
  useEffect(() => {
    if (state?.success) onDone()
  }, [state, onDone])
  const e = state?.fieldErrors ?? {}
  return (
    <form action={action} className="grid gap-4 border border-line bg-white p-5 sm:grid-cols-2" noValidate>
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      <Input label="First name" name="first_name" required defaultValue={address?.first_name ?? ""} error={e.first_name} />
      <Input label="Last name" name="last_name" required defaultValue={address?.last_name ?? ""} error={e.last_name} />
      <Input wrapperClassName="sm:col-span-2" label="Address" name="address_1" required defaultValue={address?.address_1 ?? ""} error={e.address_1} />
      <Input wrapperClassName="sm:col-span-2" label="Apartment, landmark (optional)" name="address_2" defaultValue={address?.address_2 ?? ""} />
      <Input label="City" name="city" required defaultValue={address?.city ?? ""} error={e.city} />
      <Select label="State" name="province" required placeholder="Select state" defaultValue={address?.province ?? ""} options={INDIAN_STATES.map((s) => ({ value: s, label: s }))} error={e.province} />
      <Input label="PIN code" name="postal_code" inputMode="numeric" maxLength={6} required defaultValue={address?.postal_code ?? ""} error={e.postal_code} />
      <Input label="Mobile number" name="phone" type="tel" required defaultValue={address?.phone ?? ""} error={e.phone} />
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="is_default_shipping" defaultChecked={address?.is_default_shipping} className="size-4 accent-ink" />
        Use as my default address
      </label>
      {state?.error ? <Alert className="sm:col-span-2">{state.error}</Alert> : null}
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" loading={pending}>Save address</Button>
        <Button type="button" variant="ghost" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  )
}

export function AddressBook({ addresses }: { addresses: HttpTypes.StoreCustomerAddress[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const done = () => setEditing(null)

  return (
    <div className="space-y-4">
      {editing === "new" ? (
        <AddressForm onDone={done} />
      ) : (
        <Button variant="secondary" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add address
        </Button>
      )}
      {error ? <Alert>{error}</Alert> : null}
      {!addresses.length && editing !== "new" ? (
        <EmptyState className="border border-dashed border-line py-12 sm:py-12" icon={<MapPin />} title="No saved addresses" description="Save an address for faster checkout." />
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) =>
          editing === a.id ? (
            <div key={a.id} className="md:col-span-2">
              <AddressForm address={a} onDone={done} />
            </div>
          ) : (
            <div key={a.id} className="border border-line bg-white p-5 text-[14px]">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{a.first_name} {a.last_name}</p>
                {a.is_default_shipping ? <Badge tone="muted">Default</Badge> : null}
              </div>
              <p className="mt-2 text-ink-soft">
                {a.address_1}{a.address_2 ? `, ${a.address_2}` : ""}<br />
                {a.city}, {a.province} {a.postal_code}<br />
                {a.phone}
              </p>
              <div className="mt-4 flex gap-4 text-sm">
                <button type="button" className="link-underline" onClick={() => setEditing(a.id)}>Edit</button>
                <button
                  type="button"
                  className="text-ash hover:text-ember"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await deleteAddress(a.id)
                      setError(res.ok ? null : res.error)
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
