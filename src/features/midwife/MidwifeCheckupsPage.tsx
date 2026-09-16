import { useMemo, useState } from "react"
import { useData } from "../../app/providers/DataProvider"
import { Badge, Button, Card, EmptyState, PageHeader, Toolbar } from "../../shared/components/ui"
import { useProviderSession } from "./useProviderSession"
import {
	checkupViewStatus,
	getCheckups,
	getMother,
	getMothersOfMidwife,
	motherFullName,
	subjectLabel,
} from "../../services/selectors"
import { setCheckupStatus } from "../../services/mutations"
import {
	CHECKUP_STATUS_LABELS,
	CHECKUP_STATUS_TONES,
	CHECKUP_TYPE_LABELS,
} from "../../shared/constants/labels"
import type { CheckupViewStatus } from "../../shared/types/domain"
import { formatDateTime } from "../../shared/utils/date"

const FILTERS: Array<{ value: "all" | CheckupViewStatus; label: string }> = [
	{ value: "all", label: "همه" },
	{ value: "overdue", label: CHECKUP_STATUS_LABELS.overdue },
	{ value: "due_soon", label: CHECKUP_STATUS_LABELS.due_soon },
	{ value: "pending", label: CHECKUP_STATUS_LABELS.pending },
	{ value: "done", label: CHECKUP_STATUS_LABELS.done },
]

export function MidwifeCheckupsPage() {
	const { db, providerId, displayName } = useProviderSession()
	const { mutate } = useData()
	const [filter, setFilter] = useState<"all" | CheckupViewStatus>("all")

	const rows = useMemo(() => {
		const mothers = getMothersOfMidwife(db, providerId)
		return mothers
			.flatMap((mother) => getCheckups(db, mother.id))
			.filter((checkup) => filter === "all" || checkupViewStatus(checkup) === filter)
	}, [db, providerId, filter])

	return (
		<>
			<PageHeader title="چکاپ‌های مادران" subtitle={`مراقب مسئول: ${displayName}`} />

			<Card
				title="فهرست چکاپ‌ها"
				actions={
					<Toolbar>
						{FILTERS.map((item) => (
							<Button
								key={item.value}
								variant={filter === item.value ? "primary" : "ghost"}
								onClick={() => setFilter(item.value)}
							>
								{item.label}
							</Button>
						))}
					</Toolbar>
				}
			>
				{rows.length === 0 ? (
					<EmptyState title="چکاپی با این فیلتر یافت نشد." />
				) : (
					<ul className="list">
						{rows.map((checkup) => {
							const view = checkupViewStatus(checkup)
							return (
								<li key={checkup.id} className="list__item">
									<div>
										<strong>{checkup.title}</strong>
										<p className="muted">
											{motherFullName(getMother(db, checkup.motherId))} ·{" "}
											{formatDateTime(checkup.date, checkup.time)} · {CHECKUP_TYPE_LABELS[checkup.type]} ·{" "}
											{subjectLabel(db, checkup.subject)}
										</p>
									</div>
									<div className="row-actions">
										<Badge tone={CHECKUP_STATUS_TONES[view]}>{CHECKUP_STATUS_LABELS[view]}</Badge>
										{checkup.status === "pending" && (
											<>
												<Button
													variant="ghost"
													onClick={() => {
														void mutate((current) => setCheckupStatus(current, checkup.id, "done"))
													}}
												>
													انجام شد
												</Button>
												<Button
													variant="ghost"
													onClick={() => {
														void mutate((current) => setCheckupStatus(current, checkup.id, "missed"))
													}}
												>
													انجام نشد
												</Button>
											</>
										)}
									</div>
								</li>
							)
						})}
					</ul>
				)}
			</Card>
		</>
	)
}
