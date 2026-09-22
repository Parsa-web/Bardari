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
} from "../../shared/components/ui"
import { JalaliDateInput } from "../../shared/components/DateInput"
import { TimeInput } from "../../shared/components/TimeInput"
import { CareRecordList } from "./components/CareRecordList"
import type { CareRecordItem } from "./components/CareRecordList"
import { careActions, ownedBy } from "./careStore"
import { useCare } from "./useCare"
import type { AppointmentType } from "../../data/appointments"
import {
	APPOINTMENT_STATUS_LABELS,
	APPOINTMENT_STATUS_TONES,
	APPOINTMENT_TYPE_LABELS,
	APPOINTMENT_TYPE_OPTIONS,
	isOpenAppointment,
	motherCanCancel,
} from "../../data/appointments"
import {
	CARE_PROVIDER_ROLE_LABELS,
	getProviderView,
	listProviders,
	providerOptions,
} from "../../data/doctors"
import { formatDate, formatTime, todayIso } from "../../shared/utils/date"
import "./care.css"

type AppointmentForm = {
	providerId: string
	date: string
	time: string
	type: AppointmentType
	notes: string
}

/**
 * نوبت‌دهی مادر.
 * مادر فقط درخواست ثبت می‌کند و می‌تواند لغو کند؛ تأیید، رد و ثبت انجام فقط از پنل کادر درمان انجام می‌شود.
 */
export function AppointmentsPage() {
	const { db, care, motherId, pregnancyId, assignedMidwifeId, assignedMidwife } = useCare()
	const [form, setForm] = useState<AppointmentForm>({
		providerId: "",
		date: todayIso(),
		time: "10:00",
		type: "midwifery",
		notes: "",
	})
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const providers = listProviders(db)
	const selectedProviderId = form.providerId || assignedMidwifeId || providers[0]?.id || ""
	const appointments = ownedBy(care.appointments, motherId)
	const today = todayIso()
	const upcoming = appointments
		.filter((item) => isOpenAppointment(item.status) && item.date >= today)
		.sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
	const upcomingIds = new Set(upcoming.map((item) => item.id))
	const archive = appointments
		.filter((item) => !upcomingIds.has(item.id))
		.sort((a, b) => b.date.localeCompare(a.date))

	const toItem = (id: string): CareRecordItem | null => {
		const item = appointments.find((entry) => entry.id === id)
		if (!item) return null
		const provider = getProviderView(db, item.providerId)
		return {
			id: item.id,
			title: `${APPOINTMENT_TYPE_LABELS[item.type]} · ${provider?.name ?? "کادر درمان"}`,
			badge: (
				<Badge tone={APPOINTMENT_STATUS_TONES[item.status]}>{APPOINTMENT_STATUS_LABELS[item.status]}</Badge>
			),
			meta: `${formatDate(item.date)} — ساعت ${formatTime(item.time)}${provider ? ` · ${provider.clinic}` : ""}`,
			body: item.notes || undefined,
			accent:
				item.status === "canceled" || item.status === "rejected"
					? "alert"
					: item.status === "done"
						? "done"
						: "due",
			actions: (
				<>
					{motherCanCancel(item.status) && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => careActions.cancelAppointmentByMother(item.id, motherId)}
						>
							لغو درخواست
						</Button>
					)}
					{!isOpenAppointment(item.status) && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => careActions.deleteAppointment(item.id, motherId)}
						>
							حذف از بایگانی
						</Button>
					)}
				</>
			),
		}
	}

	const upcomingItems = upcoming
		.map((item) => toItem(item.id))
		.filter((item): item is CareRecordItem => item !== null)
	const archiveItems = archive
		.map((item) => toItem(item.id))
		.filter((item): item is CareRecordItem => item !== null)

	const submit = () => {
		setNotice(null)
		if (!selectedProviderId) return setError("ماما یا پزشک موردنظر را انتخاب کنید.")
		if (!form.date) return setError("تاریخ نوبت را انتخاب کنید.")
		if (!form.time) return setError("ساعت نوبت را وارد کنید.")
		if (form.date < today) return setError("تاریخ نوبت نمی‌تواند در گذشته باشد.")
		careActions.requestAppointment({
			motherId,
			pregnancyId,
			providerId: selectedProviderId,
			date: form.date,
			time: form.time,
			type: form.type,
			notes: form.notes.trim(),
		})
		setForm({ ...form, notes: "" })
		setError(null)
		setNotice("درخواست نوبت ثبت شد و در انتظار تأیید کادر درمان است.")
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
							onClick={() => setForm({ ...form, providerId: assignedMidwife.id, type: "midwifery" })}
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
					items={providers.map((provider) => ({
						id: provider.id,
						title: provider.name,
						badge: (
							<Badge tone={provider.id === assignedMidwifeId ? "success" : "neutral"}>
								{provider.id === assignedMidwifeId
									? "مامای مسئول من"
									: CARE_PROVIDER_ROLE_LABELS[provider.role]}
							</Badge>
						),
						meta: `${provider.specialty} · ${provider.clinic} · ${provider.phone}`,
						accent: provider.id === selectedProviderId ? "due" : "none",
						actions: (
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									setForm({
										...form,
										providerId: provider.id,
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
							value={selectedProviderId}
							onChange={(value) => setForm({ ...form, providerId: value })}
							options={providerOptions(db).map((option) => ({
								value: option.value,
								label:
									option.value === assignedMidwifeId ? `${option.label} (مامای مسئول)` : option.label,
							}))}
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
							yearsBack={0}
							yearsAhead={2}
						/>
					</Field>
					<Field label="ساعت">
						<TimeInput value={form.time} onChange={(value) => setForm({ ...form, time: value })} />
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
						نوبت جدید با وضعیت «درخواست شده» ثبت می‌شود. تأیید، رد یا ثبت انجام فقط توسط کادر درمان انجام می‌شود.
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
