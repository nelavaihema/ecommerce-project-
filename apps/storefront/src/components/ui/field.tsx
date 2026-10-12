import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/util/cn"

const control =
  "block w-full rounded-xs border bg-white px-3.5 text-[15px] text-ink placeholder:text-ash/80 transition-colors focus:border-ink focus:outline-none focus:ring-0 disabled:bg-stone/50"

type FieldShellProps = {
  label: string
  name: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FieldShell({ label, name, error, hint, required, children, className }: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={name} className="block text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
        {label}
        {required ? <span className="text-ember"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${name}-error`} className="text-[13px] text-ember" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-ash">{hint}</p>
      ) : null}
    </div>
  )
}

type InputProps = ComponentProps<"input"> & {
  label: string
  name: string
  error?: string
  hint?: string
  wrapperClassName?: string
}

export function Input({ label, name, error, hint, required, className, wrapperClassName, ...props }: InputProps) {
  return (
    <FieldShell label={label} name={name} error={error} hint={hint} required={required} className={wrapperClassName}>
      <input
        id={name}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${name}-error` : undefined}
        className={cn(control, "h-12", error ? "border-ember" : "border-line", className)}
        {...props}
      />
    </FieldShell>
  )
}

type SelectProps = ComponentProps<"select"> & {
  label: string
  name: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
  wrapperClassName?: string
}

export function Select({
  label,
  name,
  error,
  options,
  placeholder,
  required,
  className,
  wrapperClassName,
  ...props
}: SelectProps) {
  return (
    <FieldShell label={label} name={name} error={error} required={required} className={wrapperClassName}>
      <select
        id={name}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(control, "h-12 appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-10", error ? "border-ember" : "border-line", className)}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%230e0e0e' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
        }}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

type TextareaProps = ComponentProps<"textarea"> & { label: string; name: string; error?: string }

export function Textarea({ label, name, error, required, className, ...props }: TextareaProps) {
  return (
    <FieldShell label={label} name={name} error={error} required={required}>
      <textarea
        id={name}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(control, "min-h-28 py-3", error ? "border-ember" : "border-line", className)}
        {...props}
      />
    </FieldShell>
  )
}
