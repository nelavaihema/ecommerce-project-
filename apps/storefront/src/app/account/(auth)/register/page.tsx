import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { RegisterForm } from "@/components/account/auth-forms"
import { getCustomer } from "@/lib/data/customer"

export const metadata: Metadata = { title: "Create account", robots: { index: false } }

type Props = { searchParams: Promise<{ redirect?: string }> }

export default async function RegisterPage({ searchParams }: Props) {
  const { redirect: to } = await searchParams
  const safeTo = to && to.startsWith("/") && !to.startsWith("//") ? to : "/account"
  if (await getCustomer()) redirect(safeTo)
  return (
    <div className="container-ds max-w-lg py-12 sm:py-20">
      <p className="eyebrow mb-2 text-center">Join DS Wardrobe</p>
      <h1 className="heading-display mb-3 text-center text-5xl">Create account</h1>
      <p className="mb-8 text-center text-sm text-ash">Track orders, save addresses and keep a wishlist.</p>
      <RegisterForm redirectTo={safeTo} />
    </div>
  )
}
