/**
 * پنل نوبت‌های کادر درمان.
 * همان رکوردهایی را می‌خواند که مادر ثبت کرده است (بدون کپی) و فقط انتقال‌های مجاز ماشین وضعیت را اعمال می‌کند.
 */

import { useMemo, useState } from "react"
import { Badge, Button, Card, EmptyState, PageHeader, Select } from "../../shared/components/ui"
import { appointmentsOfProvider, careActions, useCareState } from "../care/careStore"
import {
	APPOINTMENT_STATUS_LABELS,
	APPOINTMENT_STATUS_OPTIONS,
	APPOINTMENT_STATUS_TONES,
	APPOINTMENT_TRANSITION_LABELS,
	APPOINTMENT_TYPE_LABELS,
	isOpenAppointment,
	providerTransitions,
} from "../../data/appointments"
import type { AppointmentStatus } from "../../data/appointments"
import { motherFullName } from "../../services/selectors"
import { formatDate, formatTime, todayIso } from "../../shared/utils/date"
import { useProviderSession } from "./useProviderSession"
import "../care/care.css"

type Filter = "open" | "all" | AppointmentStatus

const FILTER_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: "open", label: "در جریان" },
	{ value: "all", label: "همه" },
	...APPOINTMENT_STATUS_OPTIONS,
]

export function MidwifeAppointmentsPage() {
	const { db, providerId } = useProviderSession()
	const care = useCareState()
	const [filter, setFilter] = useState<Filter>("open")

	const appointments = useMemo(() => {
		const list = appointmentsOfProvider(care, providerId)
		const filtered =
			filter === "all"
				? list
				: filter === "open"
					? list.filter((item) => isOpenAppointment(item.status))
					: list.filter((item) => item.status === filter)
		return [...filtered].sort((a, b) =>
			a.date === b.date ? a.time.localeCompare(b.time) : b.date.localeCompare(a.date),
		)
	}, [care, providerId, filter])

	const pending = appointmentsOfProvider(care, providerId).filter(
		(item) => item.status === "requested",
	).length
	const today = todayIso()

	return (
		<div className="care-stack">
			<PageHeader
				title="نوبت‌های مراجعان"
				subtitle="بررسی درخواست‌های نوبت، تأیید یا رد و ثبت انجام ویزیت"
				actions={
					<Select
						inline
						value={filter}
						onChange={(value) => setFilter(value as Filter)}
						options={FILTER_OPTIONS}
					/>
				}
			/>

			<Card
				title="فهرست نوبت‌ها"
				subtitle={`${pending} درخواست در انتظار بررسی`}
			>
				{appointments.length === 0 ? (
					<EmptyState
						title="نوبتی با این فیلتر وجود ندارد."
						hint="درخواست‌های ثبت‌شده توسط مادران همین‌جا نمایش داده می‌شود."
					/>
				) : (
					<ul className="care-list">
						{appointments.map((item) => {
							const transitions = providerTransitions(item.status)
							const accent =
								item.status === "done"
									? "care-list__item--done"
									: item.status === "requested"
										? "care-list__item--alert"
										: item.status === "confirmed"
											? "care-list__item--due"
											: ""
							return (
								<li key={item.id} className={`care-list__item ${accent}`}>
									<div className="care-list__head">
										<span className="care-list__title">
											{motherFullName(db, item.motherId)} · {APPOINTMENT_TYPE_LABELS[item.type]}
										</span>
										<Badge tone={APPOINTMENT_STATUS_TONES[item.status]}>
											{APPOINTMENT_STATUS_LABELS[item.status]}
										</Badge>
									</div>
									<span className="care-list__meta">
										{formatDate(item.date)} — ساعت {formatTime(item.time)}
										{item.date < today && isOpenAppointment(item.status) ? " · گذشته" : ""}
									</span>
									{item.notes && <div className="care-list__body">{item.notes}</div>}
									{transitions.length > 0 && (
										<div className="care-list__actions">
											{transitions.map((next) => (
												<Button
													key={next}
													size="sm"
													variant={next === "confirmed" || next === "done" ? "primary" : "outline"}
													onClick={() =>
														careActions.setAppointmentStatusByProvider(item.id, providerId, next)
													}
												>
													{APPOINTMENT_TRANSITION_LABELS[next]}
												</Button>
											))}
										</div>
									)}
								</li>
							)
						})}
					</ul>
				)}
				<p className="care-note">
					تأیید، رد و ثبت انجام ویزیت فقط در اختیار کادر درمان است؛ مادر فقط می‌تواند درخواست ثبت یا لغو کند.
				</p>
			</Card>
		</div>
	)
}
