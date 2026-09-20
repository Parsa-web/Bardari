import { useState } from "react"
import {
	Alert,
	Badge,
	Button,
	Card,
	Field,
	PageHeader,
	Select,
	TextArea,
	TextInput,
} from "../../shared/components/ui"
import { JalaliDateInput } from "../../shared/components/DateInput"
import { CareRecordList } from "./components/CareRecordList"
import type { CareRecordItem } from "./components/CareRecordList"
import { useMotherContext } from "../mother/useMotherContext"
import { careActions, ownedBy, useCareState } from "./careStore"
import type { AppointmentType } from "../../data/appointments"
import {
	APPOINTMENT_STATUS_LABELS,
	APPOINTMENT_STATUS_TONES,
	APPOINTMENT_TYPE_LABELS,
	APPOINTMENT_TYPE_OPTIONS,
} from "../../data/appointments"
import {
	CARE_PROVIDERS,
	CARE_PROVIDER_ROLE_LABELS,
	careProviderOptions,
	getAssignedMidwifeId,
	getCareProvider,
	getCareProviderName,
} from "../../data/doctors"
import { formatDate, formatTime, todayIso } from "../../shared/utils/date"
import "./care.css"

type AppointmentForm = {
	doctorId: string
	date: string
	time: string
	type: AppointmentType
	notes: string
}

/** نوبت‌دهی مادر با ماما و پزشک. */
export function AppointmentsPage() {
	const { motherId } = useMotherContext()
	const care = useCareState()
	const assignedMidwifeId = getAssignedMidwifeId(motherId)
	const assignedMidwife = getCareProvider(assignedMidwifeId)
	const [form, setForm] = useState<AppointmentForm>({
		doctorId: assignedMidwifeId,
		date: todayIso(),
		time: "10:00",
		type: "midwifery",
		notes: "",
	})
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const appointments = ownedBy(care.appointments, motherId)
	const today = todayIso()
	const upcoming = appointments
		.filter((item) => item.date >= today && item.status !== "canceled" && item.status !== "done")
		.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
	const archive = appointments
		.filter((item) => !upcoming.includes(item))
		.sort((a, b) => b.date.localeCompare(a.date))

	const toItem = (id: string): CareRecordItem | null => {
		const item = appointments.find((entry) => entry.id === id)
		if (!item) return null
		return {
			id: item.id,
			title: `${APPOINTMENT_TYPE_LABELS[item.type]} · ${getCareProviderName(item.doctorId)}`,
			badge: <Badge tone={APPOINTMENT_STATUS_TONES[item.status]}>{APPOINTMENT_STATUS_LABELS[item.status]}</Badge>,
			meta: `${formatDate(item.date)} — ساعت ${formatTime(item.time)}`,
			body: item.notes || undefined,
			accent: item.status === "canceled" ? "alert" : item.status === "done" ? "done" : "due",
			actions: (
				<>
					{item.status !== "done" && item.status !== "canceled" && (
						<>
							<Button
								variant="outline"
								size="sm"
								onClick={() => careActions.setAppointmentStatus(item.id, "done")}
							>
								انجام شد
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => careActions.setAppointmentStatus(item.id, "canceled")}
							>
								لغو نوبت
							</Button>
						</>
					)}
					<Button variant="ghost" size="sm" onClick={() => careActions.deleteAppointment(item.id)}>
						حذف
					</Button>
				</>
			),
		}
	}

	const upcomingItems = upcoming.map((item) => toItem(item.id)).filter((item): item is CareRecordItem => item !== null)
	const archiveItems = archive.map((item) => toItem(item.id)).filter((item): item is CareRecordItem => item !== null)

	const submit = () => {
		setNotice(null)
		if (!form.doctorId) return setError("ماما یا پزشک موردنظر را انتخاب کنید.")
		if (!form.date) return setError("تاریخ نوبت را انتخاب کنید.")
		if (!form.time) return setError("ساعت نوبت را وارد کنید.")
		careActions.addAppointment({
			motherId,
			doctorId: form.doctorId,
			date: form.date,
			time: form.time,
			type: form.type,
			status: "requested",
			notes: form.notes.trim(),
		})
		setForm({ ...form, notes: "" })
		setError(null)
		setNotice("درخواست نوبت ثبت شد و در وضعیت «درخواست شده» قرار گرفت.")
		return undefined
	}

	return (
		<div className="care-stack">
			<PageHeader title="نوبت‌ها" subtitle="درخواست و پیگیری نوبت مامایی و پزشکی" />

			{error && <Alert tone="danger">{error}</Alert>}
			{notice && <Alert tone="success">{notice}</Alert>}

			<Card title="مامای مسئول من">
				{assignedMidwife ? (
					<div className="care-provider">
						<div>
							<strong>{assignedMidwife.name}</strong>
							<p className="care-list__meta">
								{assignedMidwife.specialty} · {assignedMidwife.clinic} · {assignedMidwife.phone}
							</p>
						</div>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => setForm({ ...form, doctorId: assignedMidwife.id, type: "midwifery" })}
						>
							درخواست نوبت از مامای خودم
						</Button>
					</div>
				) : (
					<Alert tone="info">مامای مسئولی برای شما ثبت نشده است.</Alert>
				)}
			</Card>

			<Card title="کادر درمان در دسترس" subtitle="ماماها و پزشکان قابل انتخاب برای نوبت">
				<CareRecordList
					emptyTitle="کادر درمانی برای نمایش نیست."
					items={CARE_PROVIDERS.map((provider) => ({
						id: provider.id,
						title: provider.name,
						badge: (
							<Badge tone={provider.id === assignedMidwifeId ? "success" : "neutral"}>
								{provider.id === assignedMidwifeId
									? "مامای مسئول من"
									: CARE_PROVIDER_ROLE_LABELS[provider.role]}
							</Badge>
						),
						meta: `${provider.specialty} · ${provider.clinic}`,
						actions: (
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setForm({
										...form,
										doctorId: provider.id,
										type: provider.role === "midwife" ? "midwifery" : "doctor",
									})
								}
							>
								انتخاب برای نوبت
							</Button>
						),
					}))}
				/>
			</Card>

			<Card title="درخواست نوبت جدید">
				<div className="care-form">
					<Field label="ماما / پزشک">
						<Select
							value={form.doctorId}
							onChange={(value) => setForm({ ...form, doctorId: value })}
							options={careProviderOptions()}
						/>
					</Field>
					<Field label="نوع نوبت">
						<Select
							value={form.type}
							onChange={(value) => setForm({ ...form, type: value as AppointmentType })}
							options={APPOINTMENT_TYPE_OPTIONS}
						/>
					</Field>
					<Field label="تاریخ (شمسی)">
						<JalaliDateInput
							value={form.date}
							onChange={(value) => setForm({ ...form, date: value })}
							yearsBack={1}
							yearsAhead={2}
						/>
					</Field>
					<Field label="ساعت">
						<TextInput value={form.time} onChange={(value) => setForm({ ...form, time: value })} type="time" />
					</Field>
					<div className="care-form__wide">
						<Field label="یادداشت">
							<TextArea
								value={form.notes}
								onChange={(value) => setForm({ ...form, notes: value })}
								placeholder="دلیل نوبت یا نکته مهم"
							/>
						</Field>
					</div>
					<div className="care-form__actions">
						<Button variant="primary" icon="calendar" onClick={submit}>
							ثبت درخواست نوبت
						</Button>
					</div>
					<p className="care-note care-form__wide">
						نوبت جدید با وضعیت «درخواست شده» ثبت می‌شود. تایید نهایی توسط کادر درمان انجام می‌شود.
					</p>
				</div>
			</Card>

			<Card title="نوبت‌های پیش‌رو">
				<CareRecordList items={upcomingItems} emptyTitle="نوبت پیش‌رویی ندارید." />
			</Card>

			<Card title="بایگانی نوبت‌ها">
				<CareRecordList items={archiveItems} emptyTitle="نوبت گذشته‌ای ثبت نشده است." />
			</Card>
		</div>
	)
}
