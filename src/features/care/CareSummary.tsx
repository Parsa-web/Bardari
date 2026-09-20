import { Link } from "react-router-dom"
import { Badge, Card, Grid } from "../../shared/components/ui"
import { useMotherContext } from "../mother/useMotherContext"
import { ownedBy, useCareState } from "./careStore"
import { ACTIVITY_CATEGORY_LABELS } from "../../data/activities"
import {
	APPOINTMENT_STATUS_LABELS,
	APPOINTMENT_STATUS_TONES,
	APPOINTMENT_TYPE_LABELS,
} from "../../data/appointments"
import { HEALTH_CATEGORY_LABELS, HEALTH_SEVERITY_LABELS, HEALTH_SEVERITY_TONES } from "../../data/healthRecords"
import { getCareProviderName } from "../../data/doctors"
import { formatDate, formatTime, todayIso } from "../../shared/utils/date"
import "./care.css"

/** خلاصه بخش‌های جدید مراقبت برای داشبورد مادر. */
export function CareSummary() {
	const { motherId } = useMotherContext()
	const care = useCareState()
	const today = todayIso()

	const todayActivities = ownedBy(care.activities, motherId).filter((item) => item.date === today)
	const activeRecurring = ownedBy(care.recurring, motherId).filter((item) => item.active)
	const doneCount =
		todayActivities.filter((item) => item.done).length +
		activeRecurring.filter((item) => care.recurringDone.includes(`${item.id}@${today}`)).length
	const totalCount = todayActivities.length + activeRecurring.length

	const appointment = ownedBy(care.appointments, motherId)
		.filter((item) => item.date >= today && item.status !== "canceled" && item.status !== "done")
		.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))[0]

	const health = ownedBy(care.healthRecords, motherId).sort((a, b) => b.date.localeCompare(a.date))[0]

	const child = ownedBy(care.children, motherId)[0] ?? null
	const childRecords = child ? care.medicalRecords.filter((record) => record.childId === child.id) : []
	const openChildRecords = childRecords.filter((record) => !record.endDate)

	return (
		<Grid cols={2}>
			<Card
				title="فعالیت‌های برنامه روزانه"
				subtitle={totalCount > 0 ? `انجام‌شده ${doneCount} از ${totalCount}` : undefined}
				actions={<Link to="/mother/daily-activities">مشاهده</Link>}
			>
				{totalCount === 0 ? (
					<p className="care-note">برای امروز فعالیتی ثبت نشده است.</p>
				) : (
					<ul className="care-list care-list--compact">
						{activeRecurring.map((item) => (
							<li key={item.id} className="care-list__item care-list__item--due">
								<div className="care-list__head">
									<span className="care-list__title">{item.title}</span>
									<Badge tone="info">تکرار روزانه</Badge>
								</div>
								<span className="care-list__meta">
									{ACTIVITY_CATEGORY_LABELS[item.category]} · {formatTime(item.startTime)} تا {formatTime(item.endTime)}
								</span>
							</li>
						))}
						{todayActivities.map((item) => (
							<li key={item.id} className="care-list__item">
								<div className="care-list__head">
									<span className="care-list__title">{item.title}</span>
									<Badge tone={item.done ? "success" : "neutral"}>{item.done ? "انجام شد" : "انجام نشده"}</Badge>
								</div>
								<span className="care-list__meta">
									{ACTIVITY_CATEGORY_LABELS[item.category]} · {formatTime(item.startTime)} تا {formatTime(item.endTime)}
								</span>
							</li>
						))}
					</ul>
				)}
			</Card>

			<Card title="نوبت پیش‌رو" actions={<Link to="/mother/appointments">مشاهده</Link>}>
				{appointment ? (
					<ul className="care-list">
						<li className="care-list__item care-list__item--due">
							<div className="care-list__head">
								<span className="care-list__title">
									{APPOINTMENT_TYPE_LABELS[appointment.type]} · {getCareProviderName(appointment.doctorId)}
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

			<Card title="وضعیت سلامت" actions={<Link to="/mother/health">مشاهده</Link>}>
				{health ? (
					<ul className="care-list">
						<li className="care-list__item">
							<div className="care-list__head">
								<span className="care-list__title">{HEALTH_CATEGORY_LABELS[health.category]}</span>
								<Badge tone={HEALTH_SEVERITY_TONES[health.severity]}>
									شدت: {HEALTH_SEVERITY_LABELS[health.severity]}
								</Badge>
							</div>
							<span className="care-list__meta">{formatDate(health.date)}</span>
							<div className="care-list__body">{health.description}</div>
						</li>
					</ul>
				) : (
					<p className="care-note">وضعیت سلامتی ثبت نشده است.</p>
				)}
			</Card>

			{child && (
				<Card title="خلاصه سلامت کودک" actions={<Link to="/mother/child-health">مشاهده</Link>}>
					<ul className="care-list">
						<li className="care-list__item">
							<div className="care-list__head">
								<span className="care-list__title">{child.name}</span>
								<Badge tone={openChildRecords.length > 0 ? "warn" : "success"}>
									{openChildRecords.length > 0 ? "درمان در جریان" : "بدون مورد باز"}
								</Badge>
							</div>
							<span className="care-list__meta">
								تاریخ تولد: {formatDate(child.birthDate)} · تعداد سابقه ثبت‌شده: {childRecords.length}
							</span>
						</li>
					</ul>
				</Card>
			)}
		</Grid>
	)
}
