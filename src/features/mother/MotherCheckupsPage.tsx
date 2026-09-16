import { useMemo, useState } from "react"
import { useData } from "../../app/providers/DataProvider"
import {
	Alert,
	Badge,
	Button,
	Card,
	EmptyState,
	Field,
	FormRow,
	PageHeader,
} from "../../shared/components/ui"
import { decodeSubject, useMotherContext } from "./useMotherContext"
import { checkupViewStatus, getCheckups, subjectLabel } from "../../services/selectors"
import { addCheckup, setCheckupStatus } from "../../services/mutations"
import {
	CHECKUP_STATUS_LABELS,
	CHECKUP_STATUS_TONES,
	CHECKUP_TYPE_LABELS,
} from "../../shared/constants/labels"
import type { CheckupType } from "../../shared/types/domain"
import { formatDateTime, todayIso } from "../../shared/utils/date"

const TYPES = Object.keys(CHECKUP_TYPE_LABELS) as CheckupType[]

export function MotherCheckupsPage() {
	const { db, motherId, subjectOptions } = useMotherContext()
	const { mutate } = useData()
	const [error, setError] = useState<string | null>(null)
	const [form, setForm] = useState({
		subjectValue: subjectOptions[1]?.value ?? subjectOptions[0]?.value ?? "",
		title: "",
		type: "prenatal" as CheckupType,
		date: todayIso(),
		time: "",
		providerName: "",
		description: "",
	})

	const checkups = useMemo(() => getCheckups(db, motherId), [db, motherId])

	const submit = () => {
		const subject = decodeSubject(form.subjectValue)
		if (!subject) {
			setError("موضوع چکاپ را انتخاب کنید.")
			return
		}
		if (!form.title.trim() || !form.date) {
			setError("عنوان و تاریخ چکاپ الزامی است.")
			return
		}
		setError(null)
		void mutate((current) =>
			addCheckup(current, {
				motherId,
				subject,
				title: form.title.trim(),
				type: form.type,
				date: form.date,
				time: form.time || undefined,
				providerName: form.providerName.trim() || undefined,
				description: form.description.trim() || undefined,
			}),
		).then(() => setForm({ ...form, title: "", time: "", providerName: "", description: "" }))
	}

	return (
		<>
			<PageHeader title="چکاپ‌ها" subtitle="مراقبت‌ها، آزمایش‌ها و نوبت‌های ثبت‌شده" />

			{error && <Alert tone="danger">{error}</Alert>}

			<Card title="فهرست چکاپ‌ها">
				{checkups.length === 0 ? (
					<EmptyState title="چکاپی ثبت نشده است." />
				) : (
					<ul className="list">
						{checkups.map((checkup) => {
							const view = checkupViewStatus(checkup)
							return (
								<li key={checkup.id} className="list__item">
									<div>
										<strong>{checkup.title}</strong>
										<p className="muted">
											{formatDateTime(checkup.date, checkup.time)} · {CHECKUP_TYPE_LABELS[checkup.type]} ·{" "}
											{subjectLabel(db, checkup.subject)}
										</p>
										{checkup.providerName && <p className="muted">مراقب: {checkup.providerName}</p>}
										{checkup.description && <p>{checkup.description}</p>}
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
														void mutate((current) => setCheckupStatus(current, checkup.id, "canceled"))
													}}
												>
													لغو
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

			<Card title="ثبت چکاپ جدید">
				<FormRow>
					<Field label="موضوع">
						<select
							className="input"
							value={form.subjectValue}
							onChange={(event) => setForm({ ...form, subjectValue: event.target.value })}
						>
							{subjectOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="نوع">
						<select
							className="input"
							value={form.type}
							onChange={(event) => setForm({ ...form, type: event.target.value as CheckupType })}
						>
							{TYPES.map((type) => (
								<option key={type} value={type}>
									{CHECKUP_TYPE_LABELS[type]}
								</option>
							))}
						</select>
					</Field>
				</FormRow>
				<FormRow>
					<Field label="تاریخ">
						<input
							className="input"
							type="date"
							value={form.date}
							onChange={(event) => setForm({ ...form, date: event.target.value })}
						/>
					</Field>
					<Field label="ساعت" hint="اختیاری">
						<input
							className="input"
							type="time"
							value={form.time}
							onChange={(event) => setForm({ ...form, time: event.target.value })}
						/>
					</Field>
				</FormRow>
				<Field label="عنوان">
					<input
						className="input"
						value={form.title}
						onChange={(event) => setForm({ ...form, title: event.target.value })}
					/>
				</Field>
				<Field label="مراقب سلامت" hint="اختیاری">
					<input
						className="input"
						value={form.providerName}
						onChange={(event) => setForm({ ...form, providerName: event.target.value })}
					/>
				</Field>
				<Field label="توضیحات" hint="اختیاری">
					<textarea
						className="input input--area"
						value={form.description}
						onChange={(event) => setForm({ ...form, description: event.target.value })}
					/>
				</Field>
				<Button variant="primary" onClick={submit}>
					ثبت چکاپ
				</Button>
			</Card>
		</>
	)
}
