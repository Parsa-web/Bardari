/** داده و انواع «وضعیت سلامت روزانه» مادر. */

import type { Tone } from "../shared/constants/labels"
import { todayIso, addDays } from "../shared/utils/date"

export type HealthCategory = "pain" | "nausea" | "fatigue" | "headache" | "complaint" | "other"

export const HEALTH_CATEGORY_LABELS: Record<HealthCategory, string> = {
	pain: "درد",
	nausea: "تهوع",
	fatigue: "خستگی",
	headache: "سردرد",
	complaint: "شکایت",
	other: "سایر",
}

export const HEALTH_CATEGORY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: "pain", label: "درد" },
	{ value: "nausea", label: "تهوع" },
	{ value: "fatigue", label: "خستگی" },
	{ value: "headache", label: "سردرد" },
	{ value: "complaint", label: "شکایت" },
	{ value: "other", label: "سایر" },
]

export type HealthSeverity = "low" | "medium" | "high"

export const HEALTH_SEVERITY_LABELS: Record<HealthSeverity, string> = {
	low: "کم",
	medium: "متوسط",
	high: "زیاد",
}

export const HEALTH_SEVERITY_TONES: Record<HealthSeverity, Tone> = {
	low: "success",
	medium: "warn",
	high: "danger",
}

export const HEALTH_SEVERITY_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: "low", label: "کم" },
	{ value: "medium", label: "متوسط" },
	{ value: "high", label: "زیاد" },
]

export type HealthRecord = {
	id: string
	motherId: string
	date: string
	category: HealthCategory
	description: string
	severity: HealthSeverity
}

const TODAY = todayIso()

export const SEED_HEALTH_RECORDS: ReadonlyArray<HealthRecord> = [
	{
		id: "hlt-seed-1",
		motherId: "*",
		date: TODAY,
		category: "nausea",
		description: "تهوع صبحگاهی بعد از بیدار شدن",
		severity: "medium",
	},
	{
		id: "hlt-seed-2",
		motherId: "*",
		date: addDays(TODAY, -2),
		category: "fatigue",
		description: "خستگی بعد از کار روزانه",
		severity: "low",
	},
	{
		id: "hlt-seed-3",
		motherId: "*",
		date: addDays(TODAY, -6),
		category: "headache",
		description: "سردرد خفیف در بعدازظهر",
		severity: "low",
	},
]
