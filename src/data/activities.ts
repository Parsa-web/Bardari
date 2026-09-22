/**
 * فعالیت‌های روزانه مادر و روتین‌های تکرارشونده.
 * فقط چهار دسته رسمی: خواب، تغذیه، ورزش، سایر.
 * روتین فقط یک‌بار ذخیره می‌شود و نمونه روزانه از خود روتین مشتق می‌شود.
 */

export type ActivityCategory = "sleep" | "nutrition" | "exercise" | "other"

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
	sleep: "خواب",
	nutrition: "تغذیه",
	exercise: "ورزش",
	other: "سایر",
}

export const ACTIVITY_CATEGORY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: "sleep", label: "خواب" },
	{ value: "nutrition", label: "تغذیه" },
	{ value: "exercise", label: "ورزش" },
	{ value: "other", label: "سایر" },
]

export type CareActivity = {
	id: string
	motherId: string
	pregnancyId: string | null
	category: ActivityCategory
	title: string
	date: string
	startTime: string
	endTime: string
	description: string
	done: boolean
	/** اگر از یک روتین ساخته شده باشد */
	recurringId: string | null
	createdAt: string
}

export type RecurringActivity = {
	id: string
	motherId: string
	pregnancyId: string | null
	category: ActivityCategory
	title: string
	startTime: string
	endTime: string
	repeat: "daily"
	active: boolean
	description: string
	createdAt: string
}

export type ActivitySeedTemplate = {
	key: string
	category: ActivityCategory
	title: string
	dayOffset: number
	startTime: string
	endTime: string
	description: string
	done: boolean
}

export const ACTIVITY_SEED_TEMPLATES: ReadonlyArray<ActivitySeedTemplate> = [
	{
		key: "act-1",
		category: "nutrition",
		title: "صبحانه کامل با لبنیات",
		dayOffset: 0,
		startTime: "08:00",
		endTime: "08:30",
		description: "نان سبوس‌دار، پنیر و گردو",
		done: true,
	},
	{
		key: "act-2",
		category: "sleep",
		title: "خواب کوتاه بعدازظهر",
		dayOffset: 0,
		startTime: "14:00",
		endTime: "14:45",
		description: "استراحت کوتاه برای کاهش خستگی",
		done: false,
	},
]

export type RecurringSeedTemplate = {
	key: string
	category: ActivityCategory
	title: string
	startTime: string
	endTime: string
	description: string
	active: boolean
}

export const RECURRING_SEED_TEMPLATES: ReadonlyArray<RecurringSeedTemplate> = [
	{
		key: "rec-1",
		category: "exercise",
		title: "پیاده‌روی روزانه",
		startTime: "08:00",
		endTime: "08:30",
		description: "پیاده‌روی آرام بیرون از خانه",
		active: true,
	},
]
