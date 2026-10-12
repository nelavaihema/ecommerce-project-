import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AccountNav } from "@/components/account/account-nav"
import { getCustomer } from "@/lib/data/customer"

export const metadata: Metadata = { title: "My account", robots: { index: false } }

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomer()
  if (!customer) redirect("/account/login")
  return (
    <div className="container-ds pb-20 pt-8 sm:pt-12">
      <p className="eyebrow mb-2">My account</p>
      <h1 className="heading-display text-5xl sm:text-6xl">Hi, {customer.first_name || "there"}</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
        <aside className="lg:col-span-3">
          <AccountNav />
        </aside>
        <div className="min-w-0 lg:col-span-9">{children}</div>
      </div>
    </div>
  )
}
