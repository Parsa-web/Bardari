import type { ReactNode } from "react"
import { EmptyState } from "../../../shared/components/ui"
import "../care.css"

/** یک آیتم فهرست مراقبت؛ برای همه بخش‌های جدید استفاده می‌شود. */
export type CareRecordItem = {
	id: string
	title: ReactNode
	meta?: ReactNode
	body?: ReactNode
	badge?: ReactNode
	actions?: ReactNode
	accent?: "none" | "due" | "done" | "alert"
	/** دسته فعالیت؛ فقط برای رنگ‌گذاری ملایم کارت در پنل مادر استفاده می‌شود. */
	category?: "sleep" | "nutrition" | "exercise" | "other"
}

/** فهرست قابل استفاده مجدد با ظاهر یکسان در همه صفحات جدید. */
export function CareRecordList({
	items,
	emptyTitle,
	emptyHint,
}: {
	items: ReadonlyArray<CareRecordItem>
	emptyTitle: string
	emptyHint?: string
}) {
	if (items.length === 0) return <EmptyState title={emptyTitle} hint={emptyHint} />

	return (
		<ul className="care-list">
			{items.map((item) => {
				const accentClass =
					item.accent && item.accent !== "none" ? ` care-list__item--${item.accent}` : ""
				const categoryClass = item.category ? ` care-list__item--cat-${item.category}` : ""
				return (
					<li key={item.id} className={`care-list__item${accentClass}${categoryClass}`}>
						<div className="care-list__head">
							<span className="care-list__title">{item.title}</span>
							{item.badge}
						</div>
						{item.meta && <span className="care-list__meta">{item.meta}</span>}
						{item.body && <div className="care-list__body">{item.body}</div>}
						{item.actions && <div className="care-list__actions">{item.actions}</div>}
					</li>
				)
			})}
		</ul>
	)
}
