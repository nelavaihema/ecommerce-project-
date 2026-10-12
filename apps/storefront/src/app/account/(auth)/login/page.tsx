import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/account/auth-forms"
import { getCustomer } from "@/lib/data/customer"

export const metadata: Metadata = { title: "Sign in", robots: { index: false } }

type Props = { searchParams: Promise<{ redirect?: string; reason?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: to, reason } = await searchParams
  const safeTo = to && to.startsWith("/") && !to.startsWith("//") ? to : "/account"
  if (await getCustomer()) redirect(safeTo)
  return (
    <div className="container-ds max-w-md py-12 sm:py-20">
      <p className="eyebrow mb-2 text-center">Welcome back</p>
      <h1 className="heading-display mb-8 text-center text-5xl">Sign in</h1>
      <LoginForm redirectTo={safeTo} reason={reason} />
    </div>
  )
}
