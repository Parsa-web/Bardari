import { Link } from "react-router-dom"
import { Badge, Card } from "../../shared/components/ui"
import { ownedBy } from "./careStore"
import { useCare } from "./useCare"
import {
	APPOINTMENT_STATUS_LABELS,
	APPOINTMENT_STATUS_TONES,
	APPOINTMENT_TYPE_LABELS,
	isOpenAppointment,
} from "../../data/appointments"
import { getProviderView } from "../../data/doctors"
import { formatDate, formatTime, todayIso } from "../../shared/utils/date"
import "./care.css"

/** خلاصه مراقبت برای داشبورد مادر: فقط نوبت پیش‌رو (تمام‌عرض). */
export function CareSummary() {
	const { db, care, motherId } = useCare()
	const today = todayIso()

	const appointment = ownedBy(care.appointments, motherId)
		.filter((item) => item.date >= today && isOpenAppointment(item.status))
		.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))[0]
	const provider = appointment ? getProviderView(db, appointment.providerId) : null

	return (
		<Card title="نوبت پیش‌رو" actions={<Link to="/mother/appointments">مشاهده</Link>}>
			{appointment ? (
				<ul className="care-list">
					<li className="care-list__item care-list__item--due">
						<div className="care-list__head">
							<span className="care-list__title">
								{APPOINTMENT_TYPE_LABELS[appointment.type]} · {provider?.name ?? "کادر درمان"}
							</span>
							<Badge tone={APPOINTMENT_STATUS_TONES[appointment.status]}>
								{APPOINTMENT_STATUS_LABELS[appointment.status]}
							</Badge>
						</div>
						<span className="care-list__meta">
							{formatDate(appointment.date)} — ساعت {formatTime(appointment.time)}
						</span>
						{appointment.notes && <div className="care-list__body">{appointment.notes}</div>}
					</li>
				</ul>
			) : (
				<p className="care-note">نوبت پیش‌رویی ندارید.</p>
			)}
		</Card>
	)
}
