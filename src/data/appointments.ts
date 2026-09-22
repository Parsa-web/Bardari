/**
 * انواع و ماشین وضعیت «نوبت‌دهی» بین مادر و کادر درمان.
 * هر نوبت با شناسه به ارائه‌دهنده (providerId) و پرونده بارداری (pregnancyId) وصل می‌شود.
 */

import type { Tone } from "../shared/constants/labels"

export type AppointmentType = "midwifery" | "doctor" | "other"

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
	midwifery: "مامایی",
	doctor: "پزشک",
	other: "سایر",
}

export const APPOINTMENT_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: "midwifery", label: "مامایی" },
	{ value: "doctor", label: "پزشک" },
	{ value: "other", label: "سایر" },
]

/**
 * ماشین وضعیت نوبت:
 * requested ← درخواست مادر
 * requested → confirmed | rejected (فقط کادر درمان)
 * confirmed → done | canceled (فقط کادر درمان)
 * مادر فقط می‌تواند نوبت باز را لغو کند.
 */
export type AppointmentStatus = "requested" | "confirmed" | "rejected" | "done" | "canceled"

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
	requested: "درخواست شده",
	confirmed: "تأیید شده",
	rejected: "رد شده",
	done: "انجام شده",
	canceled: "لغو شده",
}

export const APPOINTMENT_STATUS_TONES: Record<AppointmentStatus, Tone> = {
	requested: "warn",
	confirmed: "info",
	rejected: "danger",
	done: "success",
	canceled: "neutral",
}

export const APPOINTMENT_STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = (
	["requested", "confirmed", "rejected", "done", "canceled"] as AppointmentStatus[]
).map((status) => ({ value: status, label: APPOINTMENT_STATUS_LABELS[status] }))

export type Appointment = {
	id: string
	motherId: string
	/** پرونده بارداری مرتبط، اگر نوبت مربوط به بارداری فعال باشد */
	pregnancyId: string | null
	/** شناسه پایدار ماما/پزشک از دفترچه واحد کادر درمان */
	providerId: string
	date: string
	time: string
	type: AppointmentType
	status: AppointmentStatus
	notes: string
	createdAt: string
	updatedAt: string
}

/** نوبت باز = هنوز به نتیجه نهایی نرسیده است. */
export function isOpenAppointment(status: AppointmentStatus): boolean {
	return status === "requested" || status === "confirmed"
}

/** مادر فقط می‌تواند نوبت باز را لغو کند؛ «انجام شد» کار کادر درمان است. */
export function motherCanCancel(status: AppointmentStatus): boolean {
	return isOpenAppointment(status)
}

/** اقدام‌های مجاز کادر درمان روی هر وضعیت. */
export function providerTransitions(status: AppointmentStatus): AppointmentStatus[] {
	if (status === "requested") return ["confirmed", "rejected"]
	if (status === "confirmed") return ["done", "canceled"]
	return []
}

export const APPOINTMENT_TRANSITION_LABELS: Record<AppointmentStatus, string> = {
	requested: "بازگرداندن به درخواست",
	confirmed: "تأیید نوبت",
	rejected: "رد درخواست",
	done: "ثبت انجام ویزیت",
	canceled: "لغو نوبت",
}

/**
 * الگوی داده نمایشی نوبت.
 * الگوها هنگام اولین ورود هر مادر با شناسه واقعی همان مادر و ارائه‌دهنده واقعی ساخته می‌شوند.
 */
export type AppointmentSeedTemplate = {
	key: string
	providerRole: "midwife" | "specialist"
	dayOffset: number
	time: string
	type: AppointmentType
	status: AppointmentStatus
	notes: string
}

export const APPOINTMENT_SEED_TEMPLATES: ReadonlyArray<AppointmentSeedTemplate> = [
	{
		key: "apt-1",
		providerRole: "midwife",
		dayOffset: 3,
		time: "10:30",
		type: "midwifery",
		status: "confirmed",
		notes: "ویزیت دوره‌ای مراقبت بارداری",
	},
	{
		key: "apt-2",
		providerRole: "specialist",
		dayOffset: 12,
		time: "17:00",
		type: "doctor",
		status: "requested",
		notes: "بررسی نتیجه سونوگرافی",
	},
	{
		key: "apt-3",
		providerRole: "midwife",
		dayOffset: -10,
		time: "09:00",
		type: "midwifery",
		status: "done",
		notes: "ویزیت انجام شد و فشار خون طبیعی بود",
	},
]
