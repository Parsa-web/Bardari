/**
 * داده و انواع «چکاپ بارداری».
 * دسته‌ها فقط دو مورد است: عمومی و سایر.
 */

import type { Tone } from "../shared/constants/labels"
import { todayIso, addDays } from "../shared/utils/date"

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
 * چکاپ عمومی: { type: "general", date, title, notes } به همراه تاریخ چکاپ بعدی.
 * چکاپ سایر: { type: "other", date, reason, notes } برای ویزیت فوری یا بررسی اضافه.
 */
export type CareCheckup = {
	id: string
	motherId: string
	type: CareCheckupType
	date: string
	title: string
	reason: string
	notes: string
	nextDate: string
	done: boolean
}

const TODAY = todayIso()

export const SEED_CARE_CHECKUPS: ReadonlyArray<CareCheckup> = [
	{
		id: "chk-seed-1",
		motherId: "*",
		type: "general",
		date: addDays(TODAY, 5),
		title: "چکاپ دوره‌ای بارداری",
		reason: "",
		notes: "همراه داشتن دفترچه مراقبت و آخرین آزمایش",
		nextDate: addDays(TODAY, 33),
		done: false,
	},
	{
		id: "chk-seed-2",
		motherId: "*",
		type: "general",
		date: addDays(TODAY, -20),
		title: "چکاپ دوره‌ای بارداری",
		reason: "",
		notes: "وزن و فشار خون در محدوده طبیعی بود",
		nextDate: addDays(TODAY, 5),
		done: true,
	},
	{
		id: "chk-seed-3",
		motherId: "*",
		type: "other",
		date: addDays(TODAY, -8),
		title: "",
		reason: "ویزیت فوری به دلیل سرگیجه",
		notes: "توصیه به استراحت و مصرف مایعات بیشتر",
		nextDate: "",
		done: true,
	},
]
