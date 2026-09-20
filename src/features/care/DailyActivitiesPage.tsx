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
import type { ActivityCategory } from "../../data/activities"
import { ACTIVITY_CATEGORY_LABELS, ACTIVITY_CATEGORY_OPTIONS } from "../../data/activities"
import { addDays, formatDate, formatTime, todayIso } from "../../shared/utils/date"
import "./care.css"

type ActivityForm = {
	category: ActivityCategory
	title: string
	date: string
	startTime: string
	endTime: string
	description: string
}

type RecurringForm = {
	category: ActivityCategory
	title: string
	startTime: string
	endTime: string
	description: string
}

function emptyActivity(date: string): ActivityForm {
	return {
		category: "exercise",
		title: "",
		date,
		startTime: "08:00",
		endTime: "08:30",
		description: "",
	}
}

const EMPTY_RECURRING: RecurringForm = {
	category: "exercise",
	title: "",
	startTime: "08:00",
	endTime: "08:30",
	description: "",
}

/** فعالیت روزانه مادر: فعالیت‌های همان روز + فعالیت‌های تکرارشونده. */
export function DailyActivitiesPage() {
	const { motherId } = useMotherContext()
	const care = useCareState()
	const [selectedDate, setSelectedDate] = useState<string>(todayIso())
	const [form, setForm] = useState<ActivityForm>(() => emptyActivity(todayIso()))
	const [recForm, setRecForm] = useState<RecurringForm>(EMPTY_RECURRING)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const activities = ownedBy(care.activities, motherId)
	const recurring = ownedBy(care.recurring, motherId)
	const dayActivities = activities
		.filter((item) => item.date === selectedDate)
		.sort((a, b) => a.startTime.localeCompare(b.startTime))

	const timeRange = (start: string, end: string) => `${formatTime(start)} تا ${formatTime(end)}`

	const dayItems: CareRecordItem[] = [
		...recurring
			.filter((item) => item.active)
			.sort((a, b) => a.startTime.localeCompare(b.startTime))
			.map<CareRecordItem>((item) => {
				const done = care.recurringDone.includes(`${item.id}@${selectedDate}`)
				return {
					id: `${item.id}-${selectedDate}`,
					title: item.title,
					badge: (
						<span className="care-list__actions">
							<Badge tone="info">تکرار روزانه</Badge>
							<Badge tone={done ? "success" : "neutral"}>{done ? "انجام شد" : "انجام نشده"}</Badge>
						</span>
					),
					meta: `${ACTIVITY_CATEGORY_LABELS[item.category]} · ${timeRange(item.startTime, item.endTime)}`,
					body: item.description || undefined,
					accent: done ? "done" : "due",
					actions: (
						<Button
							variant={done ? "outline" : "primary"}
							size="sm"
							onClick={() => careActions.toggleRecurringDone(item.id, selectedDate)}
						>
							{done ? "بازگرداندن به انجام‌نشده" : "انجام شد"}
						</Button>
					),
				}
			}),
		...dayActivities.map<CareRecordItem>((item) => ({
			id: item.id,
			title: item.title,
			badge: <Badge tone={item.done ? "success" : "neutral"}>{item.done ? "انجام شد" : "انجام نشده"}</Badge>,
			meta: `${ACTIVITY_CATEGORY_LABELS[item.category]} · ${timeRange(item.startTime, item.endTime)}`,
			body: item.description || undefined,
			accent: item.done ? "done" : "none",
			actions: (
				<>
					<Button
						variant={item.done ? "outline" : "primary"}
						size="sm"
						onClick={() => careActions.toggleActivityDone(item.id)}
					>
						{item.done ? "بازگرداندن به انجام‌نشده" : "انجام شد"}
					</Button>
					<Button variant="ghost" size="sm" onClick={() => careActions.deleteActivity(item.id)}>
						حذف
					</Button>
				</>
			),
		})),
	]

	const recurringItems: CareRecordItem[] = recurring.map((item) => ({
		id: item.id,
		title: item.title,
		badge: <Badge tone={item.active ? "success" : "neutral"}>{item.active ? "فعال" : "غیرفعال"}</Badge>,
		meta: `${ACTIVITY_CATEGORY_LABELS[item.category]} · هر روز ${timeRange(item.startTime, item.endTime)}`,
		body: item.description || undefined,
		accent: item.active ? "due" : "none",
		actions: (
			<>
				<Button variant="outline" size="sm" onClick={() => careActions.toggleRecurringActive(item.id)}>
					{item.active ? "غیرفعال کردن" : "فعال کردن"}
				</Button>
				<Button variant="ghost" size="sm" onClick={() => careActions.deleteRecurring(item.id)}>
					حذف
				</Button>
			</>
		),
	}))

	const submitActivity = () => {
		setNotice(null)
		if (!form.title.trim()) return setError("عنوان فعالیت را وارد کنید.")
		if (!form.date) return setError("تاریخ فعالیت را انتخاب کنید.")
		if (!form.startTime || !form.endTime) return setError("ساعت شروع و پایان را وارد کنید.")
		if (form.endTime <= form.startTime) return setError("ساعت پایان باید بعد از ساعت شروع باشد.")
		careActions.addActivity({
			motherId,
			category: form.category,
			title: form.title.trim(),
			date: form.date,
			startTime: form.startTime,
			endTime: form.endTime,
			description: form.description.trim(),
			done: false,
		})
		setSelectedDate(form.date)
		setForm(emptyActivity(form.date))
		setError(null)
		setNotice("فعالیت ثبت شد.")
		return undefined
	}

	const submitRecurring = () => {
		setNotice(null)
		if (!recForm.title.trim()) return setError("عنوان فعالیت تکرارشونده را وارد کنید.")
		if (recForm.endTime <= recForm.startTime) return setError("ساعت پایان باید بعد از ساعت شروع باشد.")
		careActions.addRecurring({
			motherId,
			category: recForm.category,
			title: recForm.title.trim(),
			startTime: recForm.startTime,
			endTime: recForm.endTime,
			repeat: "daily",
			active: true,
			description: recForm.description.trim(),
		})
		setRecForm(EMPTY_RECURRING)
		setError(null)
		setNotice("فعالیت تکرارشونده اضافه شد.")
		return undefined
	}

	return (
		<div className="care-stack">
			<PageHeader title="برنامه فعالیت روزانه" subtitle="خواب، ورزش، تغذیه و سایر فعالیت‌های روزانه" />

			{error && <Alert tone="danger">{error}</Alert>}
			{notice && <Alert tone="success">{notice}</Alert>}

			<Card
				title={`فعالیت‌های ${formatDate(selectedDate)}`}
				subtitle="به‌صورت پیش‌فرض فعالیت‌های امروز نمایش داده می‌شود"
				actions={
					<div className="care-list__actions">
						<Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
							روز قبل
						</Button>
						<Button
							variant="secondary"
							size="sm"
							disabled={selectedDate === todayIso()}
							onClick={() => setSelectedDate(todayIso())}
						>
							امروز
						</Button>
						<Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
							روز بعد
						</Button>
					</div>
				}
			>
				<Field label="انتخاب روز (تقویم شمسی)">
					<JalaliDateInput value={selectedDate} onChange={setSelectedDate} yearsBack={2} yearsAhead={1} />
				</Field>
				<CareRecordList
					items={dayItems}
					emptyTitle="برای این روز فعالیتی ثبت نشده است."
					emptyHint="می‌توانید خواب، ورزش، تغذیه یا فعالیت دیگری را ثبت کنید."
				/>
			</Card>

			<Card title="ثبت فعالیت جدید">
				<div className="care-form">
					<Field label="دسته">
						<Select
							value={form.category}
							onChange={(value) => setForm({ ...form, category: value as ActivityCategory })}
							options={ACTIVITY_CATEGORY_OPTIONS}
						/>
					</Field>
					<Field label="عنوان">
						<TextInput
							value={form.title}
							onChange={(value) => setForm({ ...form, title: value })}
							placeholder="مانند پیاده‌روی سبک"
						/>
					</Field>
					<Field label="تاریخ (شمسی)">
						<JalaliDateInput
							value={form.date}
							onChange={(value) => setForm({ ...form, date: value })}
							yearsBack={2}
							yearsAhead={1}
						/>
					</Field>
					<Field label="ساعت شروع و پایان">
						<div className="care-list__actions">
							<TextInput
								value={form.startTime}
								onChange={(value) => setForm({ ...form, startTime: value })}
								type="time"
								inline
							/>
							<TextInput
								value={form.endTime}
								onChange={(value) => setForm({ ...form, endTime: value })}
								type="time"
								inline
							/>
						</div>
					</Field>
					<div className="care-form__wide">
						<Field label="توضیح">
							<TextArea
								value={form.description}
								onChange={(value) => setForm({ ...form, description: value })}
								placeholder="مانند پیاده‌روی بیرون از خانه"
							/>
						</Field>
					</div>
					<div className="care-form__actions">
						<Button variant="primary" icon="check" onClick={submitActivity}>
							ثبت فعالیت
						</Button>
					</div>
				</div>
			</Card>

			<Card
				title="فعالیت‌های تکرارشونده"
				subtitle="مانند «هر روز از ۸:۰۰ تا ۸:۳۰ پیاده‌روی بیرون از خانه»"
			>
				<CareRecordList
					items={recurringItems}
					emptyTitle="فعالیت تکرارشونده‌ای ثبت نشده است."
					emptyHint="فعالیت‌های هرروزه را یک‌بار ثبت کنید تا هر روز نمایش داده شوند."
				/>

				<div className="care-form">
					<Field label="دسته">
						<Select
							value={recForm.category}
							onChange={(value) => setRecForm({ ...recForm, category: value as ActivityCategory })}
							options={ACTIVITY_CATEGORY_OPTIONS}
						/>
					</Field>
					<Field label="عنوان">
						<TextInput
							value={recForm.title}
							onChange={(value) => setRecForm({ ...recForm, title: value })}
							placeholder="مانند پیاده‌روی روزانه"
						/>
					</Field>
					<Field label="ساعت شروع و پایان">
						<div className="care-list__actions">
							<TextInput
								value={recForm.startTime}
								onChange={(value) => setRecForm({ ...recForm, startTime: value })}
								type="time"
								inline
							/>
							<TextInput
								value={recForm.endTime}
								onChange={(value) => setRecForm({ ...recForm, endTime: value })}
								type="time"
								inline
							/>
						</div>
					</Field>
					<Field label="توضیح">
						<TextInput
							value={recForm.description}
							onChange={(value) => setRecForm({ ...recForm, description: value })}
							placeholder="توضیح کوتاه"
						/>
					</Field>
					<div className="care-form__actions">
						<Button variant="secondary" icon="refresh" onClick={submitRecurring}>
							افزودن فعالیت روزانه
						</Button>
					</div>
				</div>
			</Card>
		</div>
	)
}
