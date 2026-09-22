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
import { careActions, ownedBy } from "./careStore"
import { useCare } from "./useCare"
import { getProviderView, providerOptions } from "../../data/doctors"
import type { CareCheckupType } from "../../data/checkups"
import {
	CARE_CHECKUP_TYPE_LABELS,
	CARE_CHECKUP_TYPE_OPTIONS,
	CARE_CHECKUP_TYPE_TONES,
} from "../../data/checkups"
import { formatDate, todayIso } from "../../shared/utils/date"
import "./care.css"

const FILTER_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: "all", label: "همه دسته‌ها" },
	{ value: "general", label: "عمومی" },
	{ value: "other", label: "سایر" },
]

/**
 * چکاپ‌های بارداری در دو دسته عمومی و سایر.
 * هر چکاپ به مادر، پرونده بارداری، ارائه‌دهنده و (در صورت وجود) نوبت مربوطه وصل می‌شود.
 * واکسیناسیون کودک اینجا جایی ندارد و فقط در بخش کودکان ثبت می‌شود.
 */
export function PregnancyCheckupsPage() {
	const { db, care, motherId, pregnancyId, assignedMidwifeId } = useCare()
	const [filter, setFilter] = useState("all")
	const [form, setForm] = useState({
		type: "general" as CareCheckupType,
		date: todayIso(),
		title: "",
		reason: "",
		notes: "",
		nextDate: "",
		providerId: "",
		appointmentId: "",
	})
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const today = todayIso()
	const checkups = ownedBy(care.checkups, motherId).filter((item) =>
		filter === "all" ? true : item.type === filter,
	)
	const upcoming = checkups
		.filter((item) => !item.done && item.date >= today)
		.sort((a, b) => a.date.localeCompare(b.date))
	const archive = checkups
		.filter((item) => item.done || item.date < today)
		.sort((a, b) => b.date.localeCompare(a.date))

	/** نوبت‌های تأییدشده/انجام‌شده همین مادر، برای اتصال چکاپ به نوبت. */
	const appointmentOptions = [
		{ value: "", label: "بدون اتصال به نوبت" },
		...ownedBy(care.appointments, motherId)
			.filter((item) => item.status === "confirmed" || item.status === "done")
			.sort((a, b) => b.date.localeCompare(a.date))
			.map((item) => ({
				value: item.id,
				label: `${formatDate(item.date)} · ${getProviderView(db, item.providerId)?.name ?? "کادر درمان"}`,
			})),
	]

	const providerSelectOptions = [
		{ value: "", label: "مشخص نشده" },
		...providerOptions(db).map((option) => ({
			value: option.value,
			label: option.value === assignedMidwifeId ? `${option.label} (مامای مسئول)` : option.label,
		})),
	]

	const toItem = (id: string): CareRecordItem | null => {
		const item = checkups.find((entry) => entry.id === id)
		if (!item) return null
		const provider = getProviderView(db, item.providerId)
		const metaParts = [formatDate(item.date)]
		if (item.type === "general" && item.nextDate) metaParts.push(`چکاپ بعدی: ${formatDate(item.nextDate)}`)
		if (provider) metaParts.push(provider.name)
		if (item.appointmentId) metaParts.push("متصل به نوبت")
		return {
			id: item.id,
			title: item.type === "general" ? item.title || "چکاپ عمومی" : item.reason || "چکاپ سایر",
			badge: (
				<span className="care-list__actions">
					<Badge tone={CARE_CHECKUP_TYPE_TONES[item.type]}>{CARE_CHECKUP_TYPE_LABELS[item.type]}</Badge>
					<Badge tone={item.done ? "success" : "neutral"}>{item.done ? "انجام شد" : "انجام نشده"}</Badge>
				</span>
			),
			meta: metaParts.join(" · "),
			body: item.notes || undefined,
			accent: item.done ? "done" : item.type === "other" ? "alert" : "due",
			actions: (
				<>
					<Button
						variant={item.done ? "outline" : "primary"}
						size="sm"
						onClick={() => careActions.toggleCheckupDone(item.id)}
					>
						{item.done ? "بازگرداندن به انجام‌نشده" : "انجام شد"}
					</Button>
					<Button variant="ghost" size="sm" onClick={() => careActions.deleteCheckup(item.id)}>
						حذف
					</Button>
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
		if (!form.date) return setError("تاریخ چکاپ را انتخاب کنید.")
		if (form.type === "general" && !form.title.trim()) return setError("عنوان چکاپ عمومی را وارد کنید.")
		if (form.type === "other" && !form.reason.trim()) return setError("دلیل چکاپ را وارد کنید.")
		if (form.nextDate && form.nextDate < form.date)
			return setError("تاریخ چکاپ بعدی نمی‌تواند پیش از تاریخ چکاپ باشد.")
		const linkedAppointment = form.appointmentId
			? (care.appointments.find((item) => item.id === form.appointmentId) ?? null)
			: null
		careActions.addCheckup({
			motherId,
			pregnancyId,
			providerId: linkedAppointment?.providerId ?? (form.providerId || null),
			appointmentId: linkedAppointment?.id ?? null,
			type: form.type,
			date: linkedAppointment?.date ?? form.date,
			title: form.type === "general" ? form.title.trim() : "",
			reason: form.type === "other" ? form.reason.trim() : "",
			notes: form.notes.trim(),
			nextDate: form.type === "general" ? form.nextDate : "",
		})
		setForm({ ...form, title: "", reason: "", notes: "", nextDate: "", appointmentId: "" })
		setError(null)
		setNotice("چکاپ ثبت شد.")
		return undefined
	}

	return (
		<div className="care-stack">
			<PageHeader title="چکاپ بارداری" subtitle="چکاپ‌های عمومی دوره‌ای و مراجعه‌های خارج از برنامه" />

			{error && <Alert tone="danger">{error}</Alert>}
			{notice && <Alert tone="success">{notice}</Alert>}

			<Card title="فیلتر دسته">
				<Field label="دسته چکاپ">
					<Select value={filter} onChange={setFilter} options={FILTER_OPTIONS} />
				</Field>
			</Card>

			<Card title="چکاپ‌های پیش‌رو">
				<CareRecordList
					items={upcomingItems}
					emptyTitle="چکاپ پیش‌رویی ثبت نشده است."
					emptyHint="چکاپ دوره‌ای بعدی خود را از فرم پایین ثبت کنید."
				/>
			</Card>

			<Card title="ثبت چکاپ جدید">
				<div className="care-form">
					<Field label="دسته">
						<Select
							value={form.type}
							onChange={(value) => setForm({ ...form, type: value as CareCheckupType })}
							options={CARE_CHECKUP_TYPE_OPTIONS}
						/>
					</Field>
					<Field label="تاریخ چکاپ (شمسی)">
						<JalaliDateInput
							value={form.date}
							onChange={(value) => setForm({ ...form, date: value })}
							yearsBack={1}
							yearsAhead={2}
						/>
					</Field>
					{form.type === "general" ? (
						<>
							<Field label="عنوان چکاپ">
								<TextInput
									value={form.title}
									onChange={(value) => setForm({ ...form, title: value })}
									placeholder="مانند چکاپ دوره‌ای بارداری"
								/>
							</Field>
							<Field label="تاریخ چکاپ بعدی (اختیاری)">
								<JalaliDateInput
									value={form.nextDate}
									onChange={(value) => setForm({ ...form, nextDate: value })}
									yearsBack={0}
									yearsAhead={2}
								/>
							</Field>
						</>
					) : (
						<Field label="دلیل مراجعه">
							<TextInput
								value={form.reason}
								onChange={(value) => setForm({ ...form, reason: value })}
								placeholder="مانند ویزیت فوری یا بررسی اضافه"
							/>
						</Field>
					)}
					<Field label="ارائه‌دهنده خدمت">
						<Select
							value={form.providerId}
							onChange={(value) => setForm({ ...form, providerId: value })}
							options={providerSelectOptions}
						/>
					</Field>
					<Field label="اتصال به نوبت (اختیاری)">
						<Select
							value={form.appointmentId}
							onChange={(value) => setForm({ ...form, appointmentId: value })}
							options={appointmentOptions}
						/>
					</Field>
					<div className="care-form__wide">
						<Field label="یادداشت">
							<TextArea
								value={form.notes}
								onChange={(value) => setForm({ ...form, notes: value })}
								placeholder="نکته‌های مربوط به این چکاپ"
							/>
						</Field>
					</div>
					<div className="care-form__actions">
						<Button variant="primary" icon="calendar" onClick={submit}>
							ثبت چکاپ
						</Button>
					</div>
				</div>
			</Card>

			<Card title="بایگانی چکاپ‌ها">
				<CareRecordList items={archiveItems} emptyTitle="چکاپ گذشته‌ای ثبت نشده است." />
			</Card>
		</div>
	)
}
