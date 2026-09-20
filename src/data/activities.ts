/**
 * داده و انواع «فعالیت روزانه» (خواب، ورزش، تغذیه، سایر).
 * دسته‌ها فقط همین چهار مورد هستند.
 */

import { todayIso, addDays } from "../shared/utils/date"

export type ActivityCategory = "sleep" | "exercise" | "nutrition" | "other"

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
	sleep: "خواب",
	exercise: "ورزش",
	nutrition: "تغذیه",
	other: "سایر",
}

export const ACTIVITY_CATEGORY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: "sleep", label: "خواب" },
	{ value: "exercise", label: "ورزش" },
	{ value: "nutrition", label: "تغذیه" },
	{ value: "other", label: "سایر" },
]

/** فعالیت ثبت‌شده برای یک روز مشخص. */
export type CareActivity = {
	id: string
	motherId: string
	category: ActivityCategory
	title: string
	date: string
	startTime: string
	endTime: string
	description: string
	done: boolean
}

/** فعالیت ثابت و تکرارشونده (فعلاً تکرار روزانه). */
export type RecurringActivity = {
	id: string
	motherId: string
	category: ActivityCategory
	title: string
	startTime: string
	endTime: string
	repeat: "daily"
	active: boolean
	description: string
}

const TODAY = todayIso()

export const SEED_ACTIVITIES: ReadonlyArray<CareActivity> = [
	{
		id: "act-seed-1",
		motherId: "*",
		category: "exercise",
		title: "پیاده‌روی سبک",
		date: TODAY,
		startTime: "08:00",
		endTime: "08:30",
		description: "پیاده‌روی بیرون از خانه",
		done: true,
	},
	{
		id: "act-seed-2",
		motherId: "*",
		category: "nutrition",
		title: "میان‌وعده سالم",
		date: TODAY,
		startTime: "11:00",
		endTime: "11:15",
		description: "میوه و لبنیات کم‌چرب",
		done: false,
	},
	{
		id: "act-seed-3",
		motherId: "*",
		category: "sleep",
		title: "خواب بعدازظهر",
		date: addDays(TODAY, -1),
		startTime: "14:00",
		endTime: "15:00",
		description: "استراحت کوتاه روزانه",
		done: true,
	},
]

export const SEED_RECURRING_ACTIVITIES: ReadonlyArray<RecurringActivity> = [
	{
		id: "rec-seed-1",
		motherId: "*",
		category: "exercise",
		title: "پیاده‌روی روزانه",
		startTime: "08:00",
		endTime: "08:30",
		repeat: "daily",
		active: true,
		description: "هر روز از ۸:۰۰ تا ۸:۳۰ پیاده‌روی بیرون از خانه",
	},
	{
		id: "rec-seed-2",
		motherId: "*",
		category: "nutrition",
		title: "مصرف مکمل طبق تجویز",
		startTime: "21:00",
		endTime: "21:05",
		repeat: "daily",
		active: true,
		description: "یادآوری مصرف مکمل تجویزشده توسط ماما",
	},
]
