import { AddressBook } from "@/components/account/address-book"
import { getCustomer } from "@/lib/data/customer"

export default async function AddressesPage() {
  const customer = await getCustomer()
  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em]">Saved addresses</h2>
      <AddressBook addresses={customer?.addresses ?? []} />
    </section>
  )
}
