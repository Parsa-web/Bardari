/**
 * انواع «چکاپ بارداری» (فقط دو دسته: عمومی و سایر).
 * چکاپ بارداری مادر با واکسیناسیون کودک یکی نیست؛ واکسن کودک در پرونده کودک نگهداری می‌شود.
 */

import type { Tone } from "../shared/constants/labels"

export type CareCheckupType = "general" | "other"

export const CARE_CHECKUP_TYPE_LABELS: Record<CareCheckupType, string> = {
	general: "عمومی",
	other: "سایر",
}

export const CARE_CHECKUP_TYPE_TONES: Record<CareCheckupType, Tone> = {
	general: "info",
	other: "warn",
}

export const CARE_CHECKUP_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: "general", label: "عمومی" },
	{ value: "other", label: "سایر" },
]

/**
 * چکاپ عمومی: عنوان + تاریخ + تاریخ چکاپ بعدی (اختیاری).
 * چکاپ سایر: دلیل مراجعه + تاریخ.
 * اگر چکاپ از دل یک نوبت ساخته شود، فقط appointmentId ذخیره می‌شود (بدون تکرار اطلاعات).
 */
export type CareCheckup = {
	id: string
	motherId: string
	pregnancyId: string | null
	providerId: string | null
	appointmentId: string | null
	type: CareCheckupType
	date: string
	title: string
	reason: string
	notes: string
	nextDate: string
	done: boolean
	createdAt: string
}

export type CareCheckupSeedTemplate = {
	key: string
	type: CareCheckupType
	dayOffset: number
	title: string
	reason: string
	notes: string
	nextDayOffset: number | null
	done: boolean
	/** آیا این چکاپ توسط ماما مسئول انجام می‌شود */
	byAssignedMidwife: boolean
}

export const CHECKUP_SEED_TEMPLATES: ReadonlyArray<CareCheckupSeedTemplate> = [
	{
		key: "chk-1",
		type: "general",
		dayOffset: 5,
		title: "چکاپ دوره‌ای بارداری",
		reason: "",
		notes: "همراه داشتن دفترچه مراقبت و آخرین آزمایش",
		nextDayOffset: 33,
		done: false,
		byAssignedMidwife: true,
	},
	{
		key: "chk-2",
		type: "general",
		dayOffset: -20,
		title: "چکاپ دوره‌ای بارداری",
		reason: "",
		notes: "وزن و فشار خون در محدوده طبیعی بود",
		nextDayOffset: 5,
		done: true,
		byAssignedMidwife: true,
	},
	{
		key: "chk-3",
		type: "other",
		dayOffset: -8,
		title: "",
		reason: "ویزیت فوری به دلیل سرگیجه",
		notes: "توصیه به استراحت و مصرف مایعات بیشتر",
		nextDayOffset: null,
		done: true,
		byAssignedMidwife: false,
	},
]
