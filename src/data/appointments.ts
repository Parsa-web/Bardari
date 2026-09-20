/** داده و انواع «نوبت‌دهی» بین مادر و کادر درمان. */

import type { Tone } from "../shared/constants/labels"
import { todayIso, addDays } from "../shared/utils/date"

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

export type AppointmentStatus = "requested" | "confirmed" | "canceled" | "done"

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
	requested: "درخواست شده",
	confirmed: "تایید شده",
	canceled: "لغو شده",
	done: "انجام شده",
}

export const APPOINTMENT_STATUS_TONES: Record<AppointmentStatus, Tone> = {
	requested: "warn",
	confirmed: "info",
	canceled: "danger",
	done: "success",
}

export const APPOINTMENT_STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
	{ value: "requested", label: "درخواست شده" },
	{ value: "confirmed", label: "تایید شده" },
	{ value: "canceled", label: "لغو شده" },
	{ value: "done", label: "انجام شده" },
]

export type Appointment = {
	id: string
	motherId: string
	doctorId: string
	date: string
	time: string
	type: AppointmentType
	status: AppointmentStatus
	notes: string
}

const TODAY = todayIso()

export const SEED_APPOINTMENTS: ReadonlyArray<Appointment> = [
	{
		id: "apt-seed-1",
		motherId: "*",
		doctorId: "prv-midwife-1",
		date: addDays(TODAY, 3),
		time: "10:30",
		type: "midwifery",
		status: "confirmed",
		notes: "ویزیت دوره‌ای مراقبت بارداری",
	},
	{
		id: "apt-seed-2",
		motherId: "*",
		doctorId: "prv-doctor-1",
		date: addDays(TODAY, 12),
		time: "17:00",
		type: "doctor",
		status: "requested",
		notes: "بررسی نتیجه سونوگرافی",
	},
	{
		id: "apt-seed-3",
		motherId: "*",
		doctorId: "prv-midwife-1",
		date: addDays(TODAY, -10),
		time: "09:00",
		type: "midwifery",
		status: "done",
		notes: "ویزیت انجام شد و فشار خون طبیعی بود",
	},
]
