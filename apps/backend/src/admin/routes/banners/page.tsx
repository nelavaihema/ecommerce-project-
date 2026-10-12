import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  Textarea,
  toast,
  Toaster,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type ChangeEvent, type FormEvent } from "react"
import { sdk } from "../../lib/sdk"

type Placement = "hero" | "promo" | "announcement"

type Banner = {
  id: string
  placement: Placement
  title: string
  subtitle: string | null
  eyebrow: string | null
  image_url: string | null
  mobile_image_url: string | null
  cta_label: string | null
  cta_url: string | null
  theme: "dark" | "light"
  rank: number
  is_active: boolean
}

type FormValues = Omit<Banner, "id">

const PLACEMENTS: { value: Placement; label: string; help: string }[] = [
  { value: "hero", label: "Home hero slider", help: "Full-width slides at the top of the home page. Image required." },
  { value: "promo", label: "Promo strip", help: "Large promotional band in the middle of the home page." },
  { value: "announcement", label: "Announcement bar", help: "Rotating one-line messages above the header." },
]

const empty: FormValues = {
  placement: "hero",
  title: "",
  subtitle: "",
  eyebrow: "",
  image_url: "",
  mobile_image_url: "",
  cta_label: "",
  cta_url: "",
  theme: "dark",
  rank: 0,
  is_active: true,
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string | null
  onChange: (url: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { files } = await sdk.admin.upload.create({ files: [file] })
      onChange(files[0].url)
      toast.success("Image uploaded")
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }
  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small">{label}</Label>
      <Input value={value ?? ""} placeholder="https://..." onChange={(e) => onChange(e.target.value)} />
      <div className="flex items-center gap-3">
        <label className="txt-compact-small text-ui-fg-interactive cursor-pointer hover:underline">
          {uploading ? "Uploading..." : "Upload image"}
          <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
        </label>
        {value ? <img src={value} alt="" className="h-12 w-20 rounded object-cover" /> : null}
      </div>
    </div>
  )
}

function BannerForm({
  initial,
  onSubmit,
  saving,
}: {
  initial: FormValues
  onSubmit: (values: FormValues) => void
  saving: boolean
}) {
  const [values, setValues] = useState<FormValues>(initial)
  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((v) => ({ ...v, [key]: value }))
  const placement = PLACEMENTS.find((p) => p.value === values.placement)!

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!values.title.trim()) {
      toast.error("Title is required")
      return
    }
    if (values.placement === "hero" && !values.image_url) {
      toast.error("Hero slides need an image")
      return
    }
    onSubmit(values)
  }

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
        <div className="flex flex-col gap-y-2">
          <Label size="small">Placement</Label>
          <Select value={values.placement} onValueChange={(v) => set("placement", v as Placement)}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {PLACEMENTS.map((p) => (
                <Select.Item key={p.value} value={p.value}>
                  {p.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
          <Text size="xsmall" className="text-ui-fg-subtle">{placement.help}</Text>
        </div>
        <div className="flex flex-col gap-y-2">
          <Label size="small">Title *</Label>
          <Input value={values.title} onChange={(e) => set("title", e.target.value)} maxLength={160} />
        </div>
        {values.placement !== "announcement" ? (
          <>
            <div className="flex flex-col gap-y-2">
              <Label size="small">Eyebrow (small text above title)</Label>
              <Input value={values.eyebrow ?? ""} onChange={(e) => set("eyebrow", e.target.value)} maxLength={80} />
            </div>
            <div className="flex flex-col gap-y-2">
              <Label size="small">Subtitle</Label>
              <Textarea value={values.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} maxLength={400} />
            </div>
            <ImageField label="Image (desktop)" value={values.image_url} onChange={(v) => set("image_url", v)} />
            {values.placement === "hero" ? (
              <ImageField label="Image (mobile, portrait - optional)" value={values.mobile_image_url} onChange={(v) => set("mobile_image_url", v)} />
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-y-2">
                <Label size="small">Button label</Label>
                <Input value={values.cta_label ?? ""} placeholder="Shop Now" onChange={(e) => set("cta_label", e.target.value)} maxLength={40} />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label size="small">Button link</Label>
                <Input value={values.cta_url ?? ""} placeholder="/collections/new-drop" onChange={(e) => set("cta_url", e.target.value)} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-y-2">
            <Label size="small">Link (optional)</Label>
            <Input value={values.cta_url ?? ""} placeholder="/shop?sale=1" onChange={(e) => set("cta_url", e.target.value)} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-y-2">
            <Label size="small">Order (lower shows first)</Label>
            <Input type="number" min={0} value={values.rank} onChange={(e) => set("rank", Number(e.target.value) || 0)} />
          </div>
          <div className="flex items-center gap-x-2 pt-6">
            <Switch id="is_active" checked={values.is_active} onCheckedChange={(c) => set("is_active", c)} />
            <Label htmlFor="is_active" size="small">Active</Label>
          </div>
        </div>
      </Drawer.Body>
      <Drawer.Footer>
        <Drawer.Close asChild>
          <Button variant="secondary" type="button">Cancel</Button>
        </Drawer.Close>
        <Button type="submit" isLoading={saving}>Save</Button>
      </Drawer.Footer>
    </form>
  )
}

const BannersPage = () => {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Banner | "new" | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: () => sdk.client.fetch<{ banners: Banner[] }>("/admin/content/banners"),
  })

  // Send only editable fields (the API validators are strict).
  const toPayload = (v: FormValues) => ({
    placement: v.placement,
    title: v.title,
    theme: v.theme,
    rank: v.rank,
    is_active: v.is_active,
    subtitle: v.subtitle || null,
    eyebrow: v.eyebrow || null,
    image_url: v.image_url || "",
    mobile_image_url: v.mobile_image_url || "",
    cta_label: v.cta_label || null,
    cta_url: v.cta_url || "",
  })

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      editing && editing !== "new"
        ? sdk.client.fetch(`/admin/content/banners/${editing.id}`, { method: "POST", body: toPayload(v) })
        : sdk.client.fetch("/admin/content/banners", { method: "POST", body: toPayload(v) }),
    onSuccess: () => {
      toast.success("Banner saved. The storefront updates within a minute.")
      setEditing(null)
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const toggle = useMutation({
    mutationFn: (b: Banner) =>
      sdk.client.fetch(`/admin/content/banners/${b.id}`, { method: "POST", body: { is_active: !b.is_active } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => sdk.client.fetch(`/admin/content/banners/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Banner deleted")
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const banners = data?.banners ?? []

  return (
    <div className="flex flex-col gap-y-3">
      <Toaster />
      <Container className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Storefront banners</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Manage the home page hero slider, promo strip and announcement bar.
          </Text>
        </div>
        <Button size="small" onClick={() => setEditing("new")}>Add banner</Button>
      </Container>

      {isError ? <Container><Text className="text-ui-fg-error">Couldn&apos;t load banners.</Text></Container> : null}
      {isLoading ? <Container><Text className="text-ui-fg-subtle">Loading...</Text></Container> : null}

      {PLACEMENTS.map((p) => {
        const list = banners.filter((b) => b.placement === p.value).sort((a, b) => a.rank - b.rank)
        return (
          <Container key={p.value} className="divide-y p-0">
            <div className="px-6 py-4">
              <Heading level="h2">{p.label}</Heading>
              <Text size="small" className="text-ui-fg-subtle">{p.help}</Text>
            </div>
            {!list.length ? (
              <Text size="small" className="px-6 py-4 text-ui-fg-muted">No banners yet.</Text>
            ) : (
              list.map((b) => (
                <div key={b.id} className="flex items-center gap-4 px-6 py-3">
                  {b.image_url ? (
                    <img src={b.image_url} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="bg-ui-bg-subtle h-12 w-20 shrink-0 rounded" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Text size="small" weight="plus" className="truncate">{b.title}</Text>
                    <Text size="xsmall" className="truncate text-ui-fg-subtle">
                      {[b.cta_label, b.cta_url].filter(Boolean).join(" -> ") || b.subtitle || "-"}
                    </Text>
                  </div>
                  <Badge size="2xsmall" color={b.is_active ? "green" : "grey"}>{b.is_active ? "Active" : "Hidden"}</Badge>
                  <Text size="xsmall" className="w-12 text-ui-fg-muted">#{b.rank}</Text>
                  <div className="flex gap-2">
                    <Button size="small" variant="transparent" onClick={() => toggle.mutate(b)}>
                      {b.is_active ? "Hide" : "Show"}
                    </Button>
                    <Button size="small" variant="secondary" onClick={() => setEditing(b)}>Edit</Button>
                    <Button
                      size="small"
                      variant="danger"
                      onClick={() => {
                        if (window.confirm(`Delete "${b.title}"?`)) remove.mutate(b.id)
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Container>
        )
      })}

      <Drawer open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{editing === "new" ? "Add banner" : "Edit banner"}</Drawer.Title>
          </Drawer.Header>
          {editing !== null ? (
            <BannerForm
              key={editing === "new" ? "new" : editing.id}
              initial={editing === "new" ? empty : { ...empty, ...editing }}
              onSubmit={(v) => save.mutate(v)}
              saving={save.isPending}
            />
          ) : null}
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Banners",
  icon: Photo,
  rank: 11,
})

export default BannersPage
