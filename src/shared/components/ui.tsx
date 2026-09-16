import type { ReactNode } from "react"
import type { Tone } from "../constants/labels"

/** کتابخانه کوچک کامپوننت‌های مشترک رابط کاربری (RTL و فارسی). */

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
	return <span className={`badge badge--${tone}`}>{children}</span>
}

export function Card({
	title,
	subtitle,
	actions,
	children,
	footer,
}: {
	title?: ReactNode
	subtitle?: ReactNode
	actions?: ReactNode
	children?: ReactNode
	footer?: ReactNode
}) {
	return (
		<section className="card">
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

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
	return (
		<div className="empty">
			<p className="empty__title">{title}</p>
			{hint && <p className="empty__hint">{hint}</p>}
		</div>
	)
}

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

export function Grid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
	return <div className={`grid grid--${cols}`}>{children}</div>
}

export function Button({
	children,
	onClick,
	variant = "secondary",
	type = "button",
	disabled,
	title,
}: {
	children: ReactNode
	onClick?: () => void
	variant?: "primary" | "secondary" | "ghost" | "danger"
	type?: "button" | "submit"
	disabled?: boolean
	title?: string
}) {
	return (
		<button
			className={`btn btn--${variant}`}
			type={type}
			onClick={onClick}
			disabled={disabled}
			title={title}
		>
			{children}
		</button>
	)
}

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

export function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
	return <div className={`alert alert--${tone}`}>{children}</div>
}

export function Toolbar({ children }: { children: ReactNode }) {
	return <div className="toolbar">{children}</div>
}

export function Modal({
	open,
	title,
	onClose,
	children,
}: {
	open: boolean
	title: string
	onClose: () => void
	children: ReactNode
}) {
	if (!open) return null
	return (
		<div className="modal" role="dialog" aria-modal="true" aria-label={title}>
			<div className="modal__backdrop" onClick={onClose} />
			<div className="modal__panel">
				<header className="modal__head">
					<h2>{title}</h2>
					<button className="modal__close" type="button" onClick={onClose} aria-label="بستن">
						×
					</button>
				</header>
				<div className="modal__body">{children}</div>
			</div>
		</div>
	)
}

export function Spinner({ label = "در حال بارگذاری…" }: { label?: string }) {
	return <div className="spinner">{label}</div>
}
