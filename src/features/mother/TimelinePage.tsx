import { useMemo, useState } from "react"
import { Badge, Card, EmptyState, PageHeader } from "../../shared/components/ui"
import { decodeSubject, useMotherContext } from "./useMotherContext"
import { buildTimeline, TIMELINE_TYPE_LABELS } from "../timeline/timelineService"
import { formatDate, formatTime } from "../../shared/utils/date"

export function TimelinePage() {
	const { db, motherId, subjectOptions } = useMotherContext()
	const [filter, setFilter] = useState("all")

	const events = useMemo(() => {
		const subject = filter === "all" ? null : decodeSubject(filter)
		return buildTimeline(db, motherId, subject)
	}, [db, motherId, filter])

	return (
		<>
			<PageHeader
				title="خط زمانی"
				subtitle="همه رویدادها: فعالیت، علامت، چکاپ، سؤال، ارجاع، تولد و رشد کودک"
			/>
			<Card
				actions={
					<select className="input input--inline" value={filter} onChange={(event) => setFilter(event.target.value)}>
						<option value="all">همه موضوع‌ها</option>
						{subjectOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				}
				title="رویدادها"
			>
				{events.length === 0 ? (
					<EmptyState title="رویدادی برای نمایش وجود ندارد." />
				) : (
					<ol className="timeline">
						{events.map((event) => (
							<li key={event.id} className="timeline__item">
								<div className="timeline__date">
									<strong>{formatDate(event.date)}</strong>
									{event.time && <span className="muted">ساعت {formatTime(event.time)}</span>}
								</div>
								<div className="timeline__body">
									<div className="timeline__head">
										<strong>{event.title}</strong>
										<Badge tone={event.tone}>{TIMELINE_TYPE_LABELS[event.type]}</Badge>
									</div>
									{event.description && <p>{event.description}</p>}
									{event.meta && <span className="muted">{event.meta}</span>}
								</div>
							</li>
						))}
					</ol>
				)}
			</Card>
		</>
	)
}
