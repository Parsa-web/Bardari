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
	Toolbar,
} from "../../shared/components/ui"
import { decodeSubject, useMotherContext } from "./useMotherContext"
import { getActivities, subjectLabel } from "../../services/selectors"
import { addActivity, deleteActivity, updateActivity } from "../../services/mutations"
import { ACTIVITY_CATEGORY_LABELS } from "../../shared/constants/labels"
import type { ActivityCategory } from "../../shared/types/domain"
import { formatDateLong, formatTime, nowTime, todayIso, toFa } from "../../shared/utils/date"

const CATEGORIES = Object.keys(ACTIVITY_CATEGORY_LABELS) as ActivityCategory[]

type FormState = {
	subjectValue: string
	date: string
	time: string
	title: string
	category: ActivityCategory
	duration: string
	severity: string
	description: string
}

function emptyForm(subjectValue: string): FormState {
	return {
		subjectValue,
		date: todayIso(),
		time: nowTime(),
		title: "",
		category: "food",
		duration: "",
		severity: "",
		description: "",
	}
}

/** قابلیت اصلی سامانه: ثبت و مدیریت فعالیت روزانه. */
export function ActivitiesPage() {
	const { db, motherId, subjectOptions } = useMotherContext()
	const { mutate } = useData()
	const defaultSubject = subjectOptions[1]?.value ?? subjectOptions[0]?.value ?? ""
	const [form, setForm] = useState<FormState>(() => emptyForm(defaultSubject))
	const [editingId, setEditingId] = useState<string | null>(null)
	const [filter, setFilter] = useState<string>("all")
	const [error, setError] = useState<string | null>(null)

	const activities = useMemo(() => {
		const subject = filter === "all" ? null : decodeSubject(filter)
		return getActivities(db, motherId, subject)
	}, [db, motherId, filter])

	const grouped = useMemo(() => {
		const map = new Map<string, typeof activities>()
		for (const activity of activities) {
			const list = map.get(activity.date) ?? []
			list.push(activity)
			map.set(activity.date, list)
		}
		return [...map.entries()]
	}, [activities])

	const update = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }))

	const submit = () => {
		const subject = decodeSubject(form.subjectValue)
		if (!subject) {
			setError("موضوع فعالیت را انتخاب کنید.")
			return
		}
		if (!form.title.trim()) {
			setError("عنوان فعالیت الزامی است.")
			return
		}
		if (!form.date || !form.time) {
			setError("تاریخ و ساعت الزامی است.")
			return
		}
		const payload = {
			motherId,
			subject,
			date: form.date,
			time: form.time,
			title: form.title.trim(),
			category: form.category,
			durationMinutes: form.duration ? Number(form.duration) : null,
			severity: form.category === "symptom" && form.severity ? Number(form.severity) : null,
			description: form.description.trim() || undefined,
		}
		setError(null)
		if (editingId) {
			void mutate((current) => updateActivity(current, editingId, payload))
			setEditingId(null)
		} else {
			void mutate((current) => addActivity(current, payload))
		}
		setForm(emptyForm(form.subjectValue))
	}

	if (!motherId) return <Alert tone="warn">پرونده مادر انتخاب نشده است.</Alert>

	return (
		<>
			<PageHeader
				title="فعالیت روزانه"
				subtitle="هر روز می‌توانید چند فعالیت ثبت کنید؛ همه در خط زمانی نمایش داده می‌شوند."
			/>

			<Card title={editingId ? "ویرایش فعالیت" : "ثبت فعالیت جدید"}>
				{error && <Alert tone="danger">{error}</Alert>}
				<FormRow>
					<Field label="موضوع">
						<select
							className="input"
							value={form.subjectValue}
							onChange={(event) => update({ subjectValue: event.target.value })}
						>
							{subjectOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="دسته">
						<select
							className="input"
							value={form.category}
							onChange={(event) => update({ category: event.target.value as ActivityCategory })}
						>
							{CATEGORIES.map((category) => (
								<option key={category} value={category}>
									{ACTIVITY_CATEGORY_LABELS[category]}
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
							onChange={(event) => update({ date: event.target.value })}
						/>
					</Field>
					<Field label="ساعت">
						<input
							className="input"
							type="time"
							value={form.time}
							onChange={(event) => update({ time: event.target.value })}
						/>
					</Field>
				</FormRow>

				<Field label="عنوان">
					<input
						className="input"
						value={form.title}
						placeholder="مانند: پیاده‌روی عصر"
						onChange={(event) => update({ title: event.target.value })}
					/>
				</Field>

				<FormRow>
					<Field label="مدت (دقیقه)" hint="اختیاری">
						<input
							className="input"
							type="number"
							min={0}
							value={form.duration}
							onChange={(event) => update({ duration: event.target.value })}
						/>
					</Field>
					{form.category === "symptom" && (
						<Field label="شدت علامت (۱ تا ۵)">
							<input
								className="input"
								type="number"
								min={1}
								max={5}
								value={form.severity}
								onChange={(event) => update({ severity: event.target.value })}
							/>
						</Field>
					)}
				</FormRow>

				<Field label="توضیحات" hint="اختیاری">
					<textarea
						className="input input--area"
						value={form.description}
						onChange={(event) => update({ description: event.target.value })}
					/>
				</Field>

				<Toolbar>
					<Button variant="primary" onClick={submit}>
						{editingId ? "ذخیره تغییرات" : "ثبت فعالیت"}
					</Button>
					{editingId && (
						<Button
							onClick={() => {
								setEditingId(null)
								setForm(emptyForm(form.subjectValue))
							}}
						>
							انصراف
						</Button>
					)}
				</Toolbar>
			</Card>

			<Card
				title="فعالیت‌های ثبت‌شده"
				actions={
					<select className="input input--inline" value={filter} onChange={(event) => setFilter(event.target.value)}>
						<option value="all">همه موضوع‌ها</option>
						{subjectOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				}
			>
				{grouped.length === 0 ? (
					<EmptyState title="فعالیتی ثبت نشده است." />
				) : (
					grouped.map(([date, items]) => (
						<div key={date} className="day-group">
							<h3 className="day-group__title">{formatDateLong(date)}</h3>
							<ul className="list">
								{items.map((activity) => (
									<li key={activity.id} className="list__item">
										<div>
											<strong>{activity.title}</strong>
											<p className="muted">
												ساعت {formatTime(activity.time)} · {ACTIVITY_CATEGORY_LABELS[activity.category]} ·{" "}
												{subjectLabel(db, activity.subject)}
												{activity.durationMinutes ? ` · ${toFa(activity.durationMinutes)} دقیقه` : ""}
												{activity.severity ? ` · شدت ${toFa(activity.severity)}` : ""}
											</p>
											{activity.description && <p>{activity.description}</p>}
										</div>
										<div className="row-actions">
											<Badge tone={activity.category === "symptom" ? "warn" : "info"}>
												{ACTIVITY_CATEGORY_LABELS[activity.category]}
											</Badge>
											<Button
												variant="ghost"
												onClick={() => {
													setEditingId(activity.id)
													setForm({
														subjectValue: `${activity.subject.kind}:${activity.subject.id}`,
														date: activity.date,
														time: activity.time,
														title: activity.title,
														category: activity.category,
														duration: activity.durationMinutes ? String(activity.durationMinutes) : "",
														severity: activity.severity ? String(activity.severity) : "",
														description: activity.description ?? "",
													})
												}}
											>
												ویرایش
											</Button>
											<Button
												variant="danger"
												onClick={() => {
													if (!window.confirm("این فعالیت حذف شود؟")) return
													void mutate((current) => deleteActivity(current, activity.id))
												}}
											>
												حذف
											</Button>
										</div>
									</li>
								))}
							</ul>
						</div>
					))
				)}
			</Card>
		</>
	)
}
