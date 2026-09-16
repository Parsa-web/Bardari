import { useEffect } from "react"
import type { ChangeEvent, ReactNode } from "react"
import type { Tone } from "../constants/labels"
import { Icon } from "./icons"
import type { IconName } from "./icons"

/**
 * اجزای پایه رابط کاربری (فارسی، RTL، تم روشن/تاریک).
 * همه صفحات فقط از این اجزا استفاده می‌کنند تا زبان بصری یکدست بماند.
 */

export { Icon } from "./icons"
export type { IconName } from "./icons"

/* ------------------------------- نشانک ------------------------------- */
export function Badge({
	tone = "neutral",
	dot = false,
	children,
}: {
	tone?: Tone
	dot?: boolean
	children: ReactNode
}) {
	return (
		<span className={`badge badge--${tone}`}>
			{dot && <span className="badge__dot" />}
			{children}
		</span>
	)
}

/** نشانک وضعیت: همیشه با برچسب فارسی، نه مقدار داخلی. */
export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
	return (
		<Badge tone={tone} dot>
			{label}
		</Badge>
	)
}

/* -------------------------------- کارت --------------------------------- */
export function Card({
	title,
	subtitle,
	actions,
	children,
	footer,
	variant = "default",
}: {
	title?: ReactNode
	subtitle?: ReactNode
	actions?: ReactNode
	children?: ReactNode
	footer?: ReactNode
	variant?: "default" | "quiet"
}) {
	return (
		<section className={`card${variant === "quiet" ? " card--quiet" : ""}`}>
			{(title || actions) && (
				<header className="card__head">
					<div>
						{title && <h2 className="card__title">{title}</h2>}
						{subtitle && <p className="card__subtitle">{subtitle}</p>}
					</div>
					{actions && <div className="card__actions">{actions}</div>}
				</header>
			)}
			<div className="card__body">{children}</div>
			{footer && <footer className="card__footer">{footer}</footer>}
		</section>
	)
}

export function PageHeader({
	title,
	subtitle,
	actions,
}: {
	title: ReactNode
	subtitle?: ReactNode
	actions?: ReactNode
}) {
	return (
		<div className="page-head">
			<div>
				<h1 className="page-head__title">{title}</h1>
				{subtitle && <p className="page-head__subtitle">{subtitle}</p>}
			</div>
			{actions && <div className="page-head__actions">{actions}</div>}
		</div>
	)
}

export function SectionHeader({
	title,
	actions,
}: {
	title: ReactNode
	actions?: ReactNode
}) {
	return (
		<div className="section-head">
			<h2 className="section-head__title">{title}</h2>
			{actions && <div className="page-head__actions">{actions}</div>}
		</div>
	)
}

/* ------------------------- حالت‌های خالی/خطا/بارگذاری ------------------------- */
export function EmptyState({
	title,
	hint,
	icon = "inbox",
	action,
}: {
	title: string
	hint?: string
	icon?: IconName
	action?: ReactNode
}) {
	return (
		<div className="state empty">
			<span className="state__icon">
				<Icon name={icon} />
			</span>
			<p className="state__title">{title}</p>
			{hint && <p className="state__hint">{hint}</p>}
			{action}
		</div>
	)
}

export function ErrorState({
	title = "انجام این درخواست ممکن نشد",
	hint,
	action,
}: {
	title?: string
	hint?: string
	action?: ReactNode
}) {
	return (
		<div className="state">
			<span className="state__icon">
				<Icon name="alert" />
			</span>
			<p className="state__title">{title}</p>
			{hint && <p className="state__hint">{hint}</p>}
			{action}
		</div>
	)
}

export function Skeleton({ variant = "line" }: { variant?: "line" | "title" | "block" }) {
	const suffix = variant === "line" ? "" : ` skeleton--${variant}`
	return <div className={`skeleton${suffix}`} aria-hidden="true" />
}

/** اسکلت بارگذاری برای محتوای در حال آماده‌سازی. */
export function LoadingState({ rows = 3 }: { rows?: number }) {
	return (
		<div className="skeleton-stack" role="status" aria-live="polite">
			<span className="sr-only">در حال بارگذاری اطلاعات</span>
			<Skeleton variant="title" />
			{Array.from({ length: rows }).map((_, index) => (
				<Skeleton key={index} variant="block" />
			))}
		</div>
	)
}

export function Spinner({ label = "در حال بارگذاری…" }: { label?: string }) {
	return (
		<div className="spinner" role="status" aria-live="polite">
			{label}
		</div>
	)
}

/* -------------------------------- آمار -------------------------------- */
export function Stat({
	label,
	value,
	hint,
	tone = "neutral",
}: {
	label: string
	value: ReactNode
	hint?: ReactNode
	tone?: Tone
}) {
	return (
		<div className={`stat stat--${tone}`}>
			<span className="stat__label">{label}</span>
			<strong className="stat__value">{value}</strong>
			{hint && <span className="stat__hint">{hint}</span>}
		</div>
	)
}

export function Grid({ children, cols = 3 }: { children: ReactNode; cols?: 1 | 2 | 3 | 4 }) {
	return <div className={`grid grid--${cols}`}>{children}</div>
}

/* ------------------------------- دکمه -------------------------------- */
export function Button({
	children,
	onClick,
	variant = "secondary",
	type = "button",
	disabled,
	title,
	icon,
	size = "md",
	block = false,
	loading = false,
}: {
	children: ReactNode
	onClick?: () => void
	variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success"
	type?: "button" | "submit"
	disabled?: boolean
	title?: string
	icon?: IconName
	size?: "md" | "sm"
	block?: boolean
	loading?: boolean
}) {
	const classes = [
		"btn",
		`btn--${variant}`,
		size === "sm" ? "btn--sm" : "",
		block ? "btn--block" : "",
	]
		.filter(Boolean)
		.join(" ")

	return (
		<button
			className={classes}
			type={type}
			onClick={onClick}
			disabled={disabled || loading}
			title={title}
			aria-busy={loading || undefined}
		>
			{loading ? (
				<span className="btn__spinner" aria-hidden="true" />
			) : (
				icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />
			)}
			<span>{children}</span>
		</button>
	)
}

export function IconButton({
	icon,
	label,
	onClick,
	badge,
	className,
}: {
	icon: IconName
	label: string
	onClick?: () => void
	badge?: number
	className?: string
}) {
	return (
		<button
			type="button"
			className={`icon-btn${className ? ` ${className}` : ""}`}
			onClick={onClick}
			aria-label={label}
			title={label}
		>
			<Icon name={icon} size={21} />
			{badge !== undefined && badge > 0 && (
				<span className="icon-btn__dot">{badge > 99 ? "۹۹+" : badge.toLocaleString("fa-IR")}</span>
			)}
		</button>
	)
}

/* -------------------------------- فرم --------------------------------- */
export function Field({
	label,
	hint,
	error,
	children,
}: {
	label: string
	hint?: string
	error?: string
	children: ReactNode
}) {
	return (
		<label className="field">
			<span className="field__label">{label}</span>
			{children}
			{hint && !error && <span className="field__hint">{hint}</span>}
			{error && <span className="field__error">{error}</span>}
		</label>
	)
}

export function FormRow({ children }: { children: ReactNode }) {
	return <div className="form-row">{children}</div>
}

type BaseInputProps = {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	disabled?: boolean
	invalid?: boolean
	inline?: boolean
}

export function TextInput({
	value,
	onChange,
	placeholder,
	disabled,
	invalid,
	inline,
	type = "text",
	inputMode,
}: BaseInputProps & {
	type?: "text" | "password" | "tel" | "number" | "date" | "time"
	inputMode?: "text" | "numeric" | "tel"
}) {
	return (
		<input
			className={`input${inline ? " input--inline" : ""}`}
			type={type}
			inputMode={inputMode}
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			aria-invalid={invalid || undefined}
			onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
		/>
	)
}

export function TextArea({ value, onChange, placeholder, disabled, invalid }: BaseInputProps) {
	return (
		<textarea
			className="input input--area"
			value={value}
			placeholder={placeholder}
			disabled={disabled}
			aria-invalid={invalid || undefined}
			onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)}
		/>
	)
}

export function Select({
	value,
	onChange,
	options,
	disabled,
	invalid,
	inline,
}: Omit<BaseInputProps, "placeholder"> & {
	options: ReadonlyArray<{ value: string; label: string }>
}) {
	return (
		<select
			className={`input${inline ? " input--inline" : ""}`}
			value={value}
			disabled={disabled}
			aria-invalid={invalid || undefined}
			onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
		>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	)
}

/** ورودی رمز با دکمه نمایش/پنهان‌سازی. */
export function PasswordInput({
	value,
	onChange,
	visible,
	onToggleVisible,
	placeholder,
	invalid,
	disabled,
}: BaseInputProps & { visible: boolean; onToggleVisible: () => void }) {
	return (
		<span className="input-group">
			<input
				className="input"
				type={visible ? "text" : "password"}
				value={value}
				placeholder={placeholder}
				disabled={disabled}
				aria-invalid={invalid || undefined}
				onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
			/>
			<button
				type="button"
				className="input-group__action"
				onClick={onToggleVisible}
				aria-label={visible ? "پنهان کردن رمز" : "نمایش رمز"}
			>
				<Icon name={visible ? "eye-off" : "eye"} size={18} />
			</button>
		</span>
	)
}

/* ------------------------------- پیام‌ها ------------------------------- */
export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
	const icon: IconName = tone === "danger" || tone === "warn" ? "alert" : tone === "success" ? "check" : "info"
	return (
		<div className={`alert alert--${tone}`} role={tone === "danger" ? "alert" : undefined}>
			<span className="alert__icon">
				<Icon name={icon} size={18} />
			</span>
			<span>{children}</span>
		</div>
	)
}

export function Toolbar({ children }: { children: ReactNode }) {
	return <div className="toolbar">{children}</div>
}

/* -------------------------- مودال و کشویی -------------------------- */
function useEscapeKey(active: boolean, onClose: () => void) {
	useEffect(() => {
		if (!active) return
		const handler = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose()
		}
		document.addEventListener("keydown", handler)
		return () => document.removeEventListener("keydown", handler)
	}, [active, onClose])
}

export function Modal({
	open,
	title,
	onClose,
	children,
	footer,
	size = "md",
}: {
	open: boolean
	title: string
	onClose: () => void
	children: ReactNode
	footer?: ReactNode
	size?: "md" | "sm"
}) {
	useEscapeKey(open, onClose)
	if (!open) return null
	return (
		<div className="modal" role="dialog" aria-modal="true" aria-label={title}>
			<button className="modal__backdrop" type="button" aria-label="بستن" onClick={onClose} />
			<div className={`modal__panel${size === "sm" ? " modal__panel--sm" : ""}`}>
				<header className="modal__head">
					<h2>{title}</h2>
					<button className="modal__close" type="button" onClick={onClose} aria-label="بستن">
						<Icon name="close" size={18} />
					</button>
				</header>
				<div className="modal__body">{children}</div>
				{footer && <footer className="modal__foot">{footer}</footer>}
			</div>
		</div>
	)
}

/** گفتگوی تأیید برای کنش‌های بازگشت‌ناپذیر. */
export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "تأیید",
	cancelLabel = "انصراف",
	tone = "danger",
	onConfirm,
	onCancel,
}: {
	open: boolean
	title: string
	description?: string
	confirmLabel?: string
	cancelLabel?: string
	tone?: "danger" | "primary"
	onConfirm: () => void
	onCancel: () => void
}) {
	return (
		<Modal
			open={open}
			title={title}
			onClose={onCancel}
			size="sm"
			footer={
				<>
					<Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
						{confirmLabel}
					</Button>
					<Button variant="outline" onClick={onCancel}>
						{cancelLabel}
					</Button>
				</>
			}
		>
			<p>{description ?? "این عملیات قابل بازگشت نیست. ادامه می‌دهید؟"}</p>
		</Modal>
	)
}

export function Drawer({
	open,
	title,
	onClose,
	children,
	footer,
	side = "end",
}: {
	open: boolean
	title: string
	onClose: () => void
	children: ReactNode
	footer?: ReactNode
	side?: "start" | "end"
}) {
	useEscapeKey(open, onClose)
	if (!open) return null
	return (
		<div className="drawer" role="dialog" aria-modal="true" aria-label={title}>
			<button className="drawer__backdrop" type="button" aria-label="بستن" onClick={onClose} />
			<div className={`drawer__panel${side === "start" ? " drawer__panel--start" : ""}`}>
				<header className="drawer__head">
					<span className="drawer__title">{title}</span>
					<button className="modal__close" type="button" onClick={onClose} aria-label="بستن">
						<Icon name="close" size={18} />
					</button>
				</header>
				<div className="drawer__body">{children}</div>
				{footer && <div className="drawer__foot">{footer}</div>}
			</div>
		</div>
	)
}
