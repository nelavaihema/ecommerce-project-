import { redirect } from "next/navigation"

type Props = { searchParams: Promise<{ q?: string }> }

/** /search?q=... is an alias for the shop listing with a query. */
export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  redirect(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop")
}
