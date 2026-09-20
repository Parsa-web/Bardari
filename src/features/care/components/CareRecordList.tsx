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
			{items.map((item) => (
				<li
					key={item.id}
					className={`care-list__item${item.accent && item.accent !== "none" ? ` care-list__item--${item.accent}` : ""}`}
				>
					<div className="care-list__head">
						<span className="care-list__title">{item.title}</span>
						{item.badge}
					</div>
					{item.meta && <span className="care-list__meta">{item.meta}</span>}
					{item.body && <div className="care-list__body">{item.body}</div>}
					{item.actions && <div className="care-list__actions">{item.actions}</div>}
				</li>
			))}
		</ul>
	)
}
