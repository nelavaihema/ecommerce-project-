"use client"

import { Ruler } from "lucide-react"
import { useState } from "react"
import { Drawer } from "@/components/ui/drawer"
import { SIZE_GUIDES, type SizeGuideKey } from "@/lib/util/size-guides"

export function SizeGuideTable({ guide }: { guide: SizeGuideKey }) {
  const g = SIZE_GUIDES[guide]
  return (
    <div>
      <p className="mb-3 text-sm font-semibold">{g.title}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-stone">
              {g.columns.map((c) => (
                <th key={c} className="border border-line px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {g.rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} className={i === 0 ? "border border-line px-3 py-2 font-semibold" : "border border-line px-3 py-2"}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-ash">All measurements in inches. {g.tip}</p>
    </div>
  )
}

export function SizeGuideButton({ guide }: { guide: SizeGuideKey }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-[13px] underline underline-offset-4">
        <Ruler className="size-4" /> Size guide
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Size Guide">
        <div className="space-y-6 p-5">
          <SizeGuideTable guide={guide} />
          <div className="rounded-xs bg-stone/60 p-4 text-[13px] leading-relaxed">
            <p className="font-semibold">How to measure</p>
            <p className="mt-1 text-ink-soft">
              Chest/Bust: around the fullest part. Waist: around your natural waistline. Hip: around the
              fullest part of your hips. Still unsure? Message us on Instagram and we&apos;ll help you pick.
            </p>
          </div>
        </div>
      </Drawer>
    </>
  )
}
