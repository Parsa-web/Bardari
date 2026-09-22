/** انواع «وضعیت سلامت روزانه» مادر؛ هر رکورد به مادر و پرونده بارداری وصل است. */

import type { Tone } from "../shared/constants/labels"

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
	/** پرونده بارداری مرتبط؛ برای رکوردهای خارج از دوره بارداری null است */
	pregnancyId: string | null
	date: string
	category: HealthCategory
	description: string
	severity: HealthSeverity
	createdAt: string
}

/** الگوی داده نمایشی؛ هنگام اولین ورود هر مادر با شناسه واقعی او ساخته می‌شود. */
export type HealthSeedTemplate = {
	key: string
	dayOffset: number
	category: HealthCategory
	severity: HealthSeverity
	description: string
}

export const HEALTH_SEED_TEMPLATES: ReadonlyArray<HealthSeedTemplate> = [
	{ key: "hlt-1", dayOffset: 0, category: "nausea", severity: "medium", description: "تهوع صبحگاهی بعد از بیدار شدن" },
	{ key: "hlt-2", dayOffset: -2, category: "fatigue", severity: "low", description: "خستگی بعد از کار روزانه" },
	{ key: "hlt-3", dayOffset: -6, category: "headache", severity: "low", description: "سردرد خفیف در بعدازظهر" },
]
