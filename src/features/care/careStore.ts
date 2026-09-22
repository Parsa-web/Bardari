/**
 * مخزن مراقبت روزانه (فعالیت، نوبت، وضعیت سلامت مادر، چکاپ بارداری، سابقه سلامت کودک).
 *
 * قواعد معماری:
 * - هر رکورد با شناسه پایدار مادر/کودک/ارائه‌دهنده وصل می‌شود؛ هیچ رکورد مشترک بین مادران وجود ندارد.
 * - موجودیت کودک، مادر، بارداری و کادر درمان اینجا ذخیره نمی‌شوند؛ منبع آن‌ها AppDatabase است.
 * - داده نمایشی فقط یک‌بار و برای همان مادر ساخته می‌شود (ensureSeed).
 * - تغییر وضعیت نوبت طبق ماشین وضعیت و نقش کاربر انجام می‌شود.
 */

import { useEffect, useState } from "react"
import type { ActivityCategory, CareActivity, RecurringActivity } from "../../data/activities"
import { ACTIVITY_SEED_TEMPLATES, RECURRING_SEED_TEMPLATES } from "../../data/activities"
import type { Appointment, AppointmentStatus, AppointmentType } from "../../data/appointments"
import { APPOINTMENT_SEED_TEMPLATES, motherCanCancel, providerTransitions } from "../../data/appointments"
import type { CareCheckup, CareCheckupType } from "../../data/checkups"
import { CHECKUP_SEED_TEMPLATES } from "../../data/checkups"
import type { ChildMedicalRecord } from "../../data/children"
import { CHILD_RECORD_SEED_TEMPLATES } from "../../data/children"
import type { HealthCategory, HealthRecord, HealthSeverity } from "../../data/healthRecords"
import { HEALTH_SEED_TEMPLATES } from "../../data/healthRecords"
import { addDays, nowIsoTimestamp, todayIso } from "../../shared/utils/date"

const STORAGE_KEY = "mcc.care.v2"
const LEGACY_STORAGE_KEYS = ["mcc.care.v1"]

export type CareState = {
	version: 2
	/** مادرانی که داده نمایشی آن‌ها ساخته شده است */
	seededMothers: string[]
	seededChildRecords: boolean
	activities: CareActivity[]
	recurring: RecurringActivity[]
	/** کلید «شناسه روتین@تاریخ» برای نمونه روزانه انجام‌شده */
	recurringDone: string[]
	appointments: Appointment[]
	healthRecords: HealthRecord[]
	checkups: CareCheckup[]
	medicalRecords: ChildMedicalRecord[]
}

const EMPTY_STATE: CareState = {
	version: 2,
	seededMothers: [],
	seededChildRecords: false,
	activities: [],
	recurring: [],
	recurringDone: [],
	appointments: [],
	healthRecords: [],
	checkups: [],
	medicalRecords: [],
}

function readState(): CareState {
	if (typeof window === "undefined") return EMPTY_STATE
	try {
		for (const legacy of LEGACY_STORAGE_KEYS) window.localStorage.removeItem(legacy)
		const raw = window.localStorage.getItem(STORAGE_KEY)
		if (!raw) return EMPTY_STATE
		const parsed = JSON.parse(raw) as Partial<CareState>
		if (parsed.version !== 2) return EMPTY_STATE
		return { ...EMPTY_STATE, ...parsed, version: 2 }
	} catch {
		return EMPTY_STATE
	}
}

let state: CareState = readState()
const listeners = new Set<() => void>()

function persist() {
	if (typeof window === "undefined") return
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
	} catch {
		/* ذخیره‌سازی در حالت خصوصی مرورگر ممکن است در دسترس نباشد */
	}
}

function setState(next: CareState) {
	state = next
	persist()
	listeners.forEach((listener) => listener())
}

function update(patch: (current: CareState) => CareState) {
	setState(patch(state))
}

export function getCareState(): CareState {
	return state
}

/** اشتراک در تغییرات مخزن مراقبت. */
export function useCareState(): CareState {
	const [snapshot, setSnapshot] = useState<CareState>(state)
	useEffect(() => {
		const listener = () => setSnapshot(getCareState())
		listeners.add(listener)
		listener()
		return () => {
			listeners.delete(listener)
		}
	}, [])
	return snapshot
}

/** فیلتر سختگیرانه مالکیت: مادر فقط داده خودش را می‌بیند. */
export function ownedBy<T extends { motherId: string }>(items: T[], motherId: string): T[] {
	return items.filter((item) => item.motherId === motherId)
}

export function careId(prefix: string): string {
	return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export function recurringKey(recurringId: string, date: string): string {
	return `${recurringId}@${date}`
}

export type CareSeedContext = {
	motherId: string
	pregnancyId: string | null
	midwifeId: string | null
	specialistId: string | null
}

function seedId(motherId: string, key: string): string {
	return `${motherId}::${key}`
}

/**
 * داده نمایشی هر مادر فقط یک‌بار و با شناسه‌های واقعی خودش ساخته می‌شود.
 * این تابع idempotent است.
 */
function ensureSeed(ctx: CareSeedContext) {
	const { motherId, pregnancyId, midwifeId, specialistId } = ctx
	if (!motherId) return
	const needMother = !state.seededMothers.includes(motherId)
	const needChildRecords = !state.seededChildRecords
	if (!needMother && !needChildRecords) return

	const now = nowIsoTimestamp()
	const today = todayIso()

	const activities: CareActivity[] = needMother
		? ACTIVITY_SEED_TEMPLATES.map((template) => ({
				id: seedId(motherId, template.key),
				motherId,
				pregnancyId,
				category: template.category,
				title: template.title,
				date: addDays(today, template.dayOffset),
				startTime: template.startTime,
				endTime: template.endTime,
				description: template.description,
				done: template.done,
				recurringId: null,
				createdAt: now,
			}))
		: []

	const recurring: RecurringActivity[] = needMother
		? RECURRING_SEED_TEMPLATES.map((template) => ({
				id: seedId(motherId, template.key),
				motherId,
				pregnancyId,
				category: template.category,
				title: template.title,
				startTime: template.startTime,
				endTime: template.endTime,
				repeat: "daily",
				active: template.active,
				description: template.description,
				createdAt: now,
			}))
		: []

	const appointments: Appointment[] = needMother
		? APPOINTMENT_SEED_TEMPLATES.flatMap((template) => {
				const providerId = template.providerRole === "midwife" ? midwifeId : specialistId
				if (!providerId) return []
				return [
					{
						id: seedId(motherId, template.key),
						motherId,
						pregnancyId,
						providerId,
						date: addDays(today, template.dayOffset),
						time: template.time,
						type: template.type,
						status: template.status,
						notes: template.notes,
						createdAt: now,
						updatedAt: now,
					},
				]
			})
		: []

	const healthRecords: HealthRecord[] = needMother
		? HEALTH_SEED_TEMPLATES.map((template) => ({
				id: seedId(motherId, template.key),
				motherId,
				pregnancyId,
				date: addDays(today, template.dayOffset),
				category: template.category,
				description: template.description,
				severity: template.severity,
				createdAt: now,
			}))
		: []

	const checkups: CareCheckup[] = needMother
		? CHECKUP_SEED_TEMPLATES.map((template) => ({
				id: seedId(motherId, template.key),
				motherId,
				pregnancyId,
				providerId: template.byAssignedMidwife ? midwifeId : null,
				appointmentId: null,
				type: template.type,
				date: addDays(today, template.dayOffset),
				title: template.title,
				reason: template.reason,
				notes: template.notes,
				nextDate: template.nextDayOffset === null ? "" : addDays(today, template.nextDayOffset),
				done: template.done,
				createdAt: now,
			}))
		: []

	const medicalRecords: ChildMedicalRecord[] = needChildRecords
		? CHILD_RECORD_SEED_TEMPLATES.map((template) => ({
				id: `seed::${template.key}`,
				childId: template.childId,
				illness: template.illness,
				diagnosis: template.diagnosis,
				treatment: template.treatment,
				medicationList: [...template.medicationList],
				doctorNotes: template.doctorNotes,
				startDate: addDays(today, template.startDayOffset),
				endDate: template.endDayOffset === null ? "" : addDays(today, template.endDayOffset),
				createdAt: now,
			}))
		: []

	setState({
		...state,
		seededMothers: needMother ? [...state.seededMothers, motherId] : state.seededMothers,
		seededChildRecords: true,
		activities: [...state.activities, ...activities],
		recurring: [...state.recurring, ...recurring],
		appointments: [...state.appointments, ...appointments],
		healthRecords: [...state.healthRecords, ...healthRecords],
		checkups: [...state.checkups, ...checkups],
		medicalRecords: [...state.medicalRecords, ...medicalRecords],
	})
}

export const careActions = {
	ensureSeed,

	/* ------------------------------ فعالیت روزانه ------------------------------ */

	addActivity(input: {
		motherId: string
		pregnancyId: string | null
		category: ActivityCategory
		title: string
		date: string
		startTime: string
		endTime: string
		description: string
	}): string {
		const id = careId("act")
		update((current) => ({
			...current,
			activities: [
				...current.activities,
				{ ...input, id, done: false, recurringId: null, createdAt: nowIsoTimestamp() },
			],
		}))
		return id
	},

	toggleActivityDone(id: string) {
		update((current) => ({
			...current,
			activities: current.activities.map((item) =>
				item.id === id ? { ...item, done: !item.done } : item,
			),
		}))
	},

	deleteActivity(id: string) {
		update((current) => ({
			...current,
			activities: current.activities.filter((item) => item.id !== id),
		}))
	},

	/* ------------------------------ روتین تکرارشونده ------------------------------ */

	addRecurring(input: {
		motherId: string
		pregnancyId: string | null
		category: ActivityCategory
		title: string
		startTime: string
		endTime: string
		description: string
	}): string {
		const id = careId("rec")
		update((current) => ({
			...current,
			recurring: [
				...current.recurring,
				{ ...input, id, repeat: "daily", active: true, createdAt: nowIsoTimestamp() },
			],
		}))
		return id
	},

	toggleRecurringActive(id: string) {
		update((current) => ({
			...current,
			recurring: current.recurring.map((item) =>
				item.id === id ? { ...item, active: !item.active } : item,
			),
		}))
	},

	deleteRecurring(id: string) {
		update((current) => ({
			...current,
			recurring: current.recurring.filter((item) => item.id !== id),
			recurringDone: current.recurringDone.filter((key) => !key.startsWith(`${id}@`)),
		}))
	},

	toggleRecurringDone(id: string, date: string) {
		const key = recurringKey(id, date)
		update((current) => ({
			...current,
			recurringDone: current.recurringDone.includes(key)
				? current.recurringDone.filter((item) => item !== key)
				: [...current.recurringDone, key],
		}))
	},

	/* ------------------------------ نوبت‌دهی ------------------------------ */

	/** مادر فقط می‌تواند درخواست ثبت کند؛ وضعیت اولیه همیشه «درخواست شده» است. */
	requestAppointment(input: {
		motherId: string
		pregnancyId: string | null
		providerId: string
		date: string
		time: string
		type: AppointmentType
		notes: string
	}): string {
		const id = careId("apt")
		const now = nowIsoTimestamp()
		update((current) => ({
			...current,
			appointments: [
				...current.appointments,
				{ ...input, id, status: "requested", createdAt: now, updatedAt: now },
			],
		}))
		return id
	},

	/** لغو توسط مادر؛ فقط روی نوبت باز مجاز است. */
	cancelAppointmentByMother(id: string, motherId: string) {
		update((current) => ({
			...current,
			appointments: current.appointments.map((item) =>
				item.id === id && item.motherId === motherId && motherCanCancel(item.status)
					? { ...item, status: "canceled", updatedAt: nowIsoTimestamp() }
					: item,
			),
		}))
	},

	/** تغییر وضعیت توسط کادر درمان؛ فقط انتقال‌های مجاز ماشین وضعیت. */
	setAppointmentStatusByProvider(id: string, providerId: string, next: AppointmentStatus) {
		update((current) => ({
			...current,
			appointments: current.appointments.map((item) =>
				item.id === id && item.providerId === providerId && providerTransitions(item.status).includes(next)
					? { ...item, status: next, updatedAt: nowIsoTimestamp() }
					: item,
			),
		}))
	},

	deleteAppointment(id: string, motherId: string) {
		update((current) => ({
			...current,
			appointments: current.appointments.filter(
				(item) => !(item.id === id && item.motherId === motherId),
			),
		}))
	},

	/* ------------------------------ وضعیت سلامت مادر ------------------------------ */

	addHealthRecord(input: {
		motherId: string
		pregnancyId: string | null
		date: string
		category: HealthCategory
		severity: HealthSeverity
		description: string
	}): string {
		const id = careId("hlt")
		update((current) => ({
			...current,
			healthRecords: [...current.healthRecords, { ...input, id, createdAt: nowIsoTimestamp() }],
		}))
		return id
	},

	deleteHealthRecord(id: string, motherId: string) {
		update((current) => ({
			...current,
			healthRecords: current.healthRecords.filter(
				(item) => !(item.id === id && item.motherId === motherId),
			),
		}))
	},

	/* ------------------------------ چکاپ بارداری ------------------------------ */

	addCheckup(input: {
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
	}): string {
		const id = careId("chk")
		update((current) => ({
			...current,
			checkups: [...current.checkups, { ...input, id, done: false, createdAt: nowIsoTimestamp() }],
		}))
		return id
	},

	toggleCheckupDone(id: string) {
		update((current) => ({
			...current,
			checkups: current.checkups.map((item) =>
				item.id === id ? { ...item, done: !item.done } : item,
			),
		}))
	},

	deleteCheckup(id: string) {
		update((current) => ({
			...current,
			checkups: current.checkups.filter((item) => item.id !== id),
		}))
	},

	/* ------------------------------ سابقه سلامت کودک ------------------------------ */

	addMedicalRecord(input: {
		childId: string
		illness: string
		diagnosis: string
		treatment: string
		medicationList: string[]
		doctorNotes: string
		startDate: string
		endDate: string
	}): string {
		const id = careId("cmr")
		update((current) => ({
			...current,
			medicalRecords: [...current.medicalRecords, { ...input, id, createdAt: nowIsoTimestamp() }],
		}))
		return id
	},

	deleteMedicalRecord(id: string) {
		update((current) => ({
			...current,
			medicalRecords: current.medicalRecords.filter((item) => item.id !== id),
		}))
	},

	resetCare() {
		setState(EMPTY_STATE)
	},
}

/* ------------------------------ انتخابگرهای مشترک ------------------------------ */

/** نوبت‌های مربوط به یک ارائه‌دهنده (همان رکوردهای مادر، بدون کپی). */
export function appointmentsOfProvider(current: CareState, providerId: string): Appointment[] {
	return current.appointments.filter((item) => item.providerId === providerId)
}

/** رکوردهای سلامت چند مادر (برای پنل مامای مسئول). */
export function healthRecordsOfMothers(current: CareState, motherIds: string[]): HealthRecord[] {
	const allowed = new Set(motherIds)
	return current.healthRecords.filter((item) => allowed.has(item.motherId))
}

/** فعالیت‌های چند مادر (برای پایش توسط ماما). */
export function activitiesOfMothers(current: CareState, motherIds: string[]): CareActivity[] {
	const allowed = new Set(motherIds)
	return current.activities.filter((item) => allowed.has(item.motherId))
}
