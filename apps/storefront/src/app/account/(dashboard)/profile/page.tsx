import { ProfileForm } from "@/components/account/profile-form"
import { getCustomer } from "@/lib/data/customer"

export default async function ProfilePage() {
  const customer = await getCustomer()
  if (!customer) return null
  return (
    <section>
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.16em]">Profile</h2>
      <ProfileForm customer={customer} />
    </section>
  )
}
