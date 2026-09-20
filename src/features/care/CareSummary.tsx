import { Link } from "react-router-dom"
import { Badge, Card, EmptyState, Grid } from "../../shared/components/ui"
import { useMotherContext } from "../mother/useMotherContext"
import { ownedBy, useCareState } from "./careStore"
import { ACTIVITY_CATEGORY_LABELS } from "../../data/activities"
import {
	APPOINTMENT_STATUS_LABELS,
	APPOINTMENT_STATUS_TONES,
	APPOINTMENT_TYPE_LABELS,
} from "../../data/appointments"
import { HEALTH_CATEGORY_LABELS, HEALTH_SEVERITY_LABELS, HEALTH_SEVERITY_TONES } from "../../data/healthRecords"
import { CARE_CHECKUP_TYPE_LABELS, CARE_CHECKUP_TYPE_TONES } from "../../data/checkups"
import { getCareProviderName } from "../../data/doctors"
import { formatDate, formatTime, todayIso } from "../../shared/utils/date"
import "./care.css"

/** خلاصه بخش‌های جدید مراقبت برای داشبورد مادر. */
export function CareSummary() {
	const { motherId } = useMotherContext()
	const care = useCareState()
	const today = todayIso()

	const activities = ownedBy(care.activities, motherId).filter((item) => item.date === today)
	const recurring = ownedBy(care.recurring, motherId).filter((item) => item.active)
	const appointment = ownedBy(care.appointments, motherId)
		.filter((item) => item.date >= today && item.status !== "canceled" && item.status !== "done")
		.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))[0]
	const healthRecords = ownedBy(care.healthRecords, mother