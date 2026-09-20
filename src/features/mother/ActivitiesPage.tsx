import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useData } from "../../app/providers/DataProvider"
import {
	Alert,
	Badge,
	Button,
	Card,
	ConfirmDialog,
	EmptyState,
	Field,
	FormRow,
	PageHeader,
	Select,
	TextArea,
	TextInput,
	Toolbar,
} from "../../shared/components/ui"
import { JalaliDateInput } from "../../shared/components/DateInput"
import { decodeSubject, useMotherContext } from "./useMotherContext"
import { getActivities, subjectLabel } from "../../services/selectors"
import { addActivity, deleteActivity, updateActivity } from "../../services/mutations"
import {
	ACTIVITY_CATEGORY_LABELS,
	MOTHER_ACTIVITY_CATEGORIES,
} from "../../shared/constants/labels"
import type { ActivityCategory } from "../../shared/types/domain"
import {
	addDays,
	formatDateLong,
	formatTime,
	nowTime,
	todayIso,
	toFa,
} from "../../shared/utils/date"

/** فقط چهار دسته رسمی: خواب، تغذیه، ورزش، سایر. */
const CATEGORIES = MOTHER_ACTIVITY_CATEGORIES

type FormState = {
	subjectValue: string
	date: string
	time: string
	title: string
	category: ActivityCategory
	duration: string
	description: string
}

function emptyForm(subjectValue: string, date: string): FormState {
	return {
		subjectValue,
		date,
		time: nowTime(),
		title: "",
		category: "sleep",
		duration: "",
		description: "",
	}
}

/** دفترچه ثبت دقیق فعالیت‌های روزانه و آرشیو روزهای گذشته. */
export function ActivitiesPage() {
	const { db, motherId, subjectOptions } = useMotherContext()
	const { mutate } = useData()
	const defaultSubject = subjectOptions[1]?.value ?? subjectOptions[0]?.value ?? ""
	const today = todayIso()
	const [selectedDate, setSelectedDate] = useState<string>(today)
	const [view, setView] = useState<"day" | "archive">("day")
	const [form, setForm] = useState<FormState>(() => emptyForm(defaultSubject, today))
	const [editingId, setEditingId] = useState<string | null>(null)
	const [filter, setFilter] = useState<string>("all")
	const [categoryFilter, setCategoryFilter] = useState<string>("all")
	const [error, setError] = useState<string | null>(null)
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

	const activities = useMemo(() => {
		const subject = filter === "all" ? null : decodeSubject(filter)
		const list = [...getActivities(db, motherId, subject)].filter(
			(activity) => categoryFilter === "all" || activity.category === categoryFilter,
		)
		list.sort((a, b) => {
			if (a.date !== b.date) return a.date < b.date ? 1 : -1
			return (a.time ?? "") < (b.time ?? "") ? 1 : -1
		})
		return list
	}, [db, motherId, filter, categoryFilter])

	type ActivityItem = (typeof activities)[number]

	const dayActivities = useMemo(
		() => activities.filter((activity) => activity.date === selectedDate),
		[activities, selectedDate],
	)

	const grouped = useMemo(() => {
		const map = new Map<string, ActivityItem[]>()
		for (const activity of activities) {
			const list = map.get(activity.date) ?? []
			list.push(activity)
			map.set(activity.date, list)
		}
		return [...map.entries()]
	}, [activities])

	const update = (patch: Partial<FormState>) => setForm((current) => ({ ...current, ...patch }))

	const startEdit = (activity: ActivityItem) => {
		setEditingId(activity.id)
		setError(null)
		setForm({
			subjectValue: `${activity.subject.kind}:${activity.subject.id}`,
			date: activity.date,
			time: activity.time,
			title: activity.title,
			category: CATEGORIES.includes(activity.category) ? activity.category : "note",
			duration: activity.durationMinutes ? String(activity.durationMinutes) : "",
			description: activity.description ?? "",
		})
		if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
	}

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
		if (!CATEGORIES.includes(form.category)) {
			setError("دسته فعالیت فقط می‌تواند خواب، تغذیه، ورزش یا سایر باشد.")
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
			severity: null,
			description: form.description.trim() || undefined,
		}
		setError(null)
		if (editingId) {
			void mutate((current) => updateActivity(current, editingId, payload))
			setEditingId(null)
		} else {
			void mutate((current) => addActivity(current, payload))
		}
		setSelectedDate(form.date)
		setView("day")
		setForm(emptyForm(form.subjectValue, form.date))
	}

	const renderItem = (activity: ActivityItem) => (
		<li key={activity.id} className="list__item">
			<div>
				<strong>{activity.title}</strong>
				<p className="meta">
					ساعت {formatTime(activity.time)} · {ACTIVITY_CATEGORY_LABELS[activity.category]} ·{" "}
					{subjectLabel(db, activity.subject)}
					{activity.durationMinutes ? ` · ${toFa(activity.durationMinutes)} دقیقه` : ""}
				</p>
				{activity.description && <p>{activity.description}</p>}
			</div>
			<div className="row-actions">
				<Badge tone="info">{ACTIVITY_CATEGORY_LABELS[activity.category]}</Badge>
				<Button variant="ghost" size="sm" onClick={() => startEdit(activity)}>
					ویرایش
				</Button>
				<Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(activity.id)}>
					حذف
				</Button>
			</div>
		</li>
	)

	if (!motherId) return <Alert tone="warn">پرونده مادر انتخاب نشده است.</Alert>

	return (
		<>
			<PageHeader
				title="دفترچه فعالیت"
				subtitle="ثبت دقیق فعالیت‌های هر روز در چهار دسته: خواب، تغذیه، ورزش و سایر"
			/>

			<Alert tone="info">
				برای کارهایی که هر روز تکرار می‌شوند، یک‌بار در{" "}
				<Link to="/mother/daily-activities">برنامه روزانه و روتین‌ها</Link> روتین بسازید تا هر روز
				خودکار نمایش داده شود.
			</Alert>

			<Card title={editingId ? "ویرایش فعالیت" : "ثبت فعالیت جدید"}>
				{error && <Alert tone="danger">{error}</Alert>}
				<FormRow>
					<Field label="موضوع">
						<Select
							value={form.subjectValue}
							onChange={(value) => update({ subjectValue: value })}
							options={subjectOptions.map((option) => ({ value: option.value, label: option.label }))}
						/>
					</Field>
					<Field label="دسته">
						<Select
							value={form.category}
							onChange={(value) => update({ category: value as ActivityCategory })}
							options={CATEGORIES.map((category) => ({
								value: category,
								label: ACTIVITY_CATEGORY_LABELS[category],
							}))}
						/>
					</Field>
				</FormRow>

				<FormRow>
					<Field label="تاریخ (شمسی)">
						<JalaliDateInput value={form.date} onChange={(value) => update({ date: value })} />
					</Field>
					<Field label="ساعت">
						<TextInput type="time" value={form.time} onChange={(value) => update({ time: value })} />
					</Field>
				</FormRow>

				<Field label="عنوان">
					<TextInput
						value={form.title}
						placeholder="مانند: پیاده‌روی عصر"
						onChange={(value) => update({ title: value })}
					/>
				</Field>

				<Field label="مدت (دقیقه)" hint="اختیاری">
					<TextInput
						type="number"
						inputMode="numeric"
						value={form.duration}
						onChange={(value) => update({ duration: value })}
					/>
				</Field>

				<Field label="توضیحات" hint="اختیاری">
					<TextArea value={form.description} onChange={(value) => update({ description: value })} />
				</Field>

				<Toolbar>
					<Button variant="primary" icon={editingId ? "check" : "plus"} onClick={submit}>
						{editingId ? "ذخیره تغییرات" : "ثبت فعالیت"}
					</Button>
					{editingId && (
						<Button
							variant="outline"
							onClick={() => {
								setEditingId(null)
								setError(null)
								setForm(emptyForm(form.subjectValue, selectedDate))
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
					<Select
						inline
						value={filter}
						onChange={(value) => setFilter(value)}
						options={[
							{ value: "all", label: "همه موضوع‌ها" },
							...subjectOptions.map((option) => ({ value: option.value, label: option.label })),
						]}
					/>
				}
			>
				<Field label="دسته">
					<Select
						value={categoryFilter}
						onChange={(value) => setCategoryFilter(value)}
						options={[
							{ value: "all", label: "همه دسته‌ها" },
							...CATEGORIES.map((category) => ({
								value: category,
								label: ACTIVITY_CATEGORY_LABELS[category],
							})),
						]}
					/>
				</Field>

				<Toolbar>
					<Button variant={view === "day" ? "primary" : "ghost"} size="sm" onClick={() => setView("day")}>
						نمایش روزانه
					</Button>
					<Button
						variant={view === "archive" ? "primary" : "ghost"}
						size="sm"
						onClick={() => setView("archive")}
					>
						آرشیو همه روزها
					</Button>
				</Toolbar>

				{view === "day" ? (
					<>
						<div className="daynav">
							<span className="daynav__label">
								<span className="daynav__title">{formatDateLong(selectedDate)}</span>
								<span className="daynav__hint">
									{selectedDate === today ? "امروز" : "روز دیگری انتخاب شده"} ·{" "}
									{toFa(dayActivities.length)} فعالیت
								</span>
							</span>
							<span className="daynav__actions">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setSelectedDate(addDays(selectedDate, -1))}
								>
									روز قبل
								</Button>
								<Button
									variant={selectedDate === today ? "primary" : "ghost"}
									size="sm"
									onClick={() => setSelectedDate(today)}
								>
									امروز
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setSelectedDate(addDays(selectedDate, 1))}
								>
									روز بعد
								</Button>
							</span>
						</div>

						<Field label="انتخاب روز (شمسی)">
							<JalaliDateInput
								value={selectedDate}
								showPreview={false}
								onChange={(value) => setSelectedDate(value || today)}
							/>
						</Field>

						{dayActivities.length === 0 ? (
							<EmptyState
								icon="activity"
								title="برای این روز فعالیتی ثبت نشده است"
								hint="از فرم بالا می‌توانید خواب، تغذیه، ورزش یا سایر را ثبت کنید."
							/>
						) : (
							<ul className="list">{dayActivities.map(renderItem)}</ul>
						)}
					</>
				) : grouped.length === 0 ? (
					<EmptyState
						icon="activity"
						title="فعالیتی برای این فیلتر ثبت نشده است"
						hint="فیلتر موضوع یا دسته را تغییر دهید یا فعالیت جدیدی ثبت کنید."
					/>
				) : (
					grouped.map(([date, items]) => (
						<div key={date} className="group">
							<div className="group__head">
								<h3 className="group__title">
									{formatDateLong(date)}
									{date === today && <Badge tone="info">امروز</Badge>}
								</h3>
								<span className="group__count">{toFa(items.length)} فعالیت</span>
							</div>
							<ul className="list">{items.map(renderItem)}</ul>
						</div>
					))
				)}
			</Card>

			<ConfirmDialog
				open={pendingDeleteId !== null}
				title="حذف فعالیت"
				description="این فعالیت از پرونده و خط زمانی حذف می‌شود. این اقدام قابل بازگرداندن نیست."
				confirmLabel="حذف فعالیت"
				cancelLabel="انصراف"
				tone="danger"
				onCancel={() => setPendingDeleteId(null)}
				onConfirm={() => {
					const id = pendingDeleteId
					setPendingDeleteId(null)
					if (!id) return
					if (editingId === id) {
						setEditingId(null)
						setForm(emptyForm(form.subjectValue, selectedDate))
					}
					void mutate((current) => deleteActivity(current, id))
				}}
			/>
		</>
	)
}
