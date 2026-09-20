import { useState } from "react"
import {
	Alert,
	Badge,
	Button,
	Card,
	EmptyState,
	Field,
	PageHeader,
	Select,
	TextArea,
} from "../../shared/components/ui"
import { JalaliDateInput } from "../../shared/components/DateInput"
import { useMotherContext } from "../mother/useMotherContext"
import { careActions, ownedBy, useCareState } from "./careStore"
import type { HealthCategory, HealthSeverity } from "../../data/healthRecords"
import {
	HEALTH_CATEGORY_LABELS,
	HEALTH_CATEGORY_OPTIONS,
	HEALTH_SEVERITY_LABELS,
	HEALTH_SEVERITY_OPTIONS,
	HEALTH_SEVERITY_TONES,
} from "../../data/healthRecords"
import { formatDateLong, todayIso } from "../../shared/utils/date"
import "./care.css"

/** ثبت وضعیت سلامت روزانه مادر به همراه خط زمانی سابقه. */
export function HealthStatusPage() {
	const { motherId } = useMotherContext()
	const care = useCareState()
	const [form, setForm] = useState({
		date: todayIso(),
		category: "nausea" as HealthCategory,
		severity: "medium" as HealthSeverity,
		description: "",
	})
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const records = ownedBy(care.healthRecords, motherId).sort((a, b) => b.date.localeCompare(a.date))
	const todayRecords = records.filter((item) => item.date === todayIso())

	const submit = () => {
		setNotice(null)
		if (!form.date) return setError("تاریخ را انتخاب کنید.")
		if (!form.description.trim()) return setError("توضیح وضعیت را بنویسید.")
		careActions.addHealthRecord({
			motherId,
			date: form.date,
			category: form.category,
			severity: form.severity,
			description: form.description.trim(),
		})
		setForm({ ...form, description: "" })
		setError(null)
		setNotice("وضعیت سلامت ثبت شد.")
		return undefined
	}

	return (
		<div className="care-stack">
			<PageHeader title="وضعیت سلامت" subtitle="ثبت روزانه درد، تهوع، خستگی و سایر شکایت‌ها" />

			{error && <Alert tone="danger">{error}</Alert>}
			{notice && <Alert tone="success">{notice}</Alert>}

			<Card title="وضعیت امروز">
				{todayRecords.length === 0 ? (
					<EmptyState
						title="برای امروز وضعیتی ثبت نشده است."
						hint="ثبت منظم علامت‌ها به مامای شما در پیگیری بهتر کمک می‌کند."
					/>
				) : (
					<ul className="care-list">
						{todayRecords.map((item) => (
							<li key={item.id} className="care-list__item care-list__item--due">
								<div className="care-list__head">
									<span className="care-list__title">{HEALTH_CATEGORY_LABELS[item.category]}</span>
									<Badge tone={HEALTH_SEVERITY_TONES[item.severity]}>
										شدت: {HEALTH_SEVERITY_LABELS[item.severity]}
									</Badge>
								</div>
								<div className="care-list__body">{item.description}</div>
							</li>
						))}
					</ul>
				)}
			</Card>

			<Card title="ثبت وضعیت جدید">
				<div className="care-form">
					<Field label="تاریخ (شمسی)">
						<JalaliDateInput
							value={form.date}
							onChange={(value) => setForm({ ...form, date: value })}
							yearsBack={2}
							yearsAhead={0}
						/>
					</Field>
					<Field label="دسته">
						<Select
							value={form.category}
							onChange={(value) => setForm({ ...form, category: value as HealthCategory })}
							options={HEALTH_CATEGORY_OPTIONS}
						/>
					</Field>
					<Field label="شدت">
						<Select
							value={form.severity}
							onChange={(value) => setForm({ ...form, severity: value as HealthSeverity })}
							options={HEALTH_SEVERITY_OPTIONS}
						/>
					</Field>
					<div className="care-form__wide">
						<Field label="توضیح">
							<TextArea
								value={form.description}
								onChange={(value) => setForm({ ...form, description: value })}
								placeholder="مانند تهوع صبحگاهی بعد از بیدار شدن"
							/>
						</Field>
					</div>
					<div className="care-form__actions">
						<Button variant="primary" icon="check" onClick={submit}>
							ثبت وضعیت
						</Button>
					</div>
				</div>
			</Card>

			<Card title="خط زمانی سلامت" subtitle="سابقه وضعیت سلامت از جدید به قدیم">
				{records.length === 0 ? (
					<EmptyState title="سابقه‌ای برای نمایش نیست." />
				) : (
					<ul className="care-timeline">
						{records.map((item) => (
							<li key={item.id} className="care-timeline__item">
								<span className="care-timeline__date">{formatDateLong(item.date)}</span>
								<div className="care-list__head">
									<span className="care-list__title">{HEALTH_CATEGORY_LABELS[item.category]}</span>
									<span className="care-list__actions">
										<Badge tone={HEALTH_SEVERITY_TONES[item.severity]}>
											شدت: {HEALTH_SEVERITY_LABELS[item.severity]}
										</Badge>
										<Button variant="ghost" size="sm" onClick={() => careActions.deleteHealthRecord(item.id)}>
											حذف
										</Button>
									</span>
								</div>
								<div className="care-list__body">{item.description}</div>
							</li>
						))}
					</ul>
				)}
			</Card>
		</div>
	)
}
