import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Select, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { formatInr, sdk } from "../lib/sdk"

type Summary = {
  days: number
  orders: number
  revenue: number
  average_order_value: number
  series: { date: string; revenue: number }[]
  top_products: { title: string; quantity: number; revenue: number }[]
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-y-1">
      <Text size="xsmall" className="text-ui-fg-subtle uppercase">{label}</Text>
      <Text size="xlarge" weight="plus">{value}</Text>
    </div>
  )
}

/** Sales overview shown above the orders list. */
const SalesOverviewWidget = () => {
  const [days, setDays] = useState("30")
  const { data, isLoading, isError } = useQuery({
    queryKey: ["analytics-summary", days],
    queryFn: () => sdk.client.fetch<Summary>("/admin/analytics/summary", { query: { days } }),
  })

  const max = Math.max(1, ...(data?.series ?? []).map((s) => s.revenue))

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Sales overview</Heading>
        <div className="w-36">
          <Select value={days} onValueChange={setDays} size="small">
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="7">Last 7 days</Select.Item>
              <Select.Item value="30">Last 30 days</Select.Item>
              <Select.Item value="90">Last 90 days</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>
      {isError ? (
        <Text className="px-6 py-4 text-ui-fg-error">Couldn&apos;t load sales data.</Text>
      ) : isLoading || !data ? (
        <Text className="px-6 py-4 text-ui-fg-subtle">Loading...</Text>
      ) : (
        <div className="grid gap-6 px-6 py-4 lg:grid-cols-3">
          <div className="grid grid-cols-3 gap-4 lg:col-span-2">
            <Stat label="Revenue" value={formatInr(data.revenue)} />
            <Stat label="Orders" value={String(data.orders)} />
            <Stat label="Avg. order" value={formatInr(data.average_order_value)} />
            <div className="col-span-3 flex h-24 items-end gap-[2px]" aria-label="Daily revenue">
              {data.series.map((s) => (
                <div
                  key={s.date}
                  title={`${s.date}: ${formatInr(s.revenue)}`}
                  className="bg-ui-fg-interactive flex-1 rounded-t-sm opacity-80"
                  style={{ height: `${Math.max(2, (s.revenue / max) * 100)}%` }}
                />
              ))}
            </div>
          </div>
          <div>
            <Text size="xsmall" className="mb-2 text-ui-fg-subtle uppercase">Top products</Text>
            {data.top_products.length ? (
              <ol className="flex flex-col gap-y-1.5">
                {data.top_products.map((p, i) => (
                  <li key={p.title} className="flex justify-between gap-2">
                    <Text size="small" className="truncate">{i + 1}. {p.title}</Text>
                    <Text size="small" className="text-ui-fg-subtle shrink-0">{p.quantity} sold</Text>
                  </li>
                ))}
              </ol>
            ) : (
              <Text size="small" className="text-ui-fg-muted">No sales in this period yet.</Text>
            )}
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default SalesOverviewWidget
