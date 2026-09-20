/**
 * انبار داده محلی بخش‌های جدید مراقبت (فعالیت، نوبت، سلامت، چکاپ، کودک).
 * داده اولیه از فایل‌های src/data خوانده و تغییرها در localStorage نگه داشته می‌شود.
 * این لایه جدا از کامپوننت‌ها است تا منطق داخل UI نباشد.
 */

import { useEffect, useState } from "react"
import type { CareActivity, RecurringActivity } from "../../data/activities"
import { SEED_ACTIVITIES, SEED_RECURRING_ACTIVITIES } from "../../data/activities"
import type { Appointment, AppointmentStatus } from "../../data/appointments"
import { SEED_APPOINTMENTS } from "../../data/appointments"
import type { HealthRecord } from "../../data/healthRecords"
import { SEED_HEALTH_RECORDS } from "../../data/healthRecords"
import type { CareCheckup } from "../../data/checkups"
import { SEED_CARE_CHECKUPS } from "../../data/checkups"
import type { CareChild, ChildMedicalRecord } from "../../data/children"
import { SEED_CARE_CHILDREN, SEED_CHILD_RECORDS } from "../../data/children"

/** داده نمایشی مشترک که برای همه مادران دیده می‌شود. */
export const SHARED_DEMO_OWNER = "*"

const STORAGE_KEY = "mcc.care.v1"

export type CareState = {
	activities: CareActivity[]
	recurring: RecurringActivity[]
	/** کلیدهای «انجام‌شده» برای فعالیت‌های تکرارشونده به شکل id@YYYY-MM-DD */
	recurringDone: string[]
	appointments: Appointment[]
	healthRecords: HealthRecord[]
	checkups: CareCheckup[]
	children: CareChild[]
	medicalRecords: ChildMedicalRecord[]
}

function initialState(): CareState {
	return {
		activities: SEED_ACTIVITIES.map((item) => ({ ...item })),
		recurring: SEED_RECURRING_ACTIVITIES.map((item) => ({ ...item })),
		recurringDone: [],
		appointments: SEED_APPOINTMENTS.map((item) => ({ ...item })),
		healthRecords: SEED_HEALTH_RECORDS.map((item) => ({ ...item })),
		checkups: SEED_CARE_CHECKUPS.map((item) => ({ ...item })),
		children: SEED_CARE_CHILDREN.map((item) => ({ ...item })),
		medicalRecords: SEED_CHILD_RECORDS.map((item) => ({ ...item, medicationList: [...item.medicationList] })),
	}
}

function load(): CareState {
	const base = initialState()
	if (typeof window === "undefined") return base
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY)
		if (!raw) return base
		const parsed = JSON.parse(raw) as Partial<CareState>
		return {
			activities: parsed.activities ?? base.activities,
			recurring: parsed.recurring ?? base.recurring,
			recurringDone: parsed.recurringDone ?? base.recurringDone,
			appointments: parsed.appointments ?? base.appointments,
			healthRecords: parsed.healthRecords ?? base.healthRecords,
			checkups: parsed.checkups ?? base.checkups,
			children: parsed.children ?? base.children,
			medicalRecords: parsed.medicalRecords ?? base.medicalRecords,
		}
	} catch {
		return base
	}
}

let state: CareState = load()
const listeners = new Set<(next: CareState) => void>()

function commit(next: CareState) {
	state = next
	try {
		if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
	} catch {
		// اگر حافظه مرورگر در دسترس نبود، داده فقط در همین نشست می‌ماند.
	}
	for (const listener of listeners) listener(state)
}

/** اشتراک در تغییرهای انبار داده مراقبت. */
export function useCareState(): CareState {
	const [snapshot, setSnapshot] = useState<CareState>(state)
	useEffect(() => {
		const listener = (next: CareState) => setSnapshot(next)
		listeners.add(listener)
		setSnapshot(state)
		return () => {
			listeners.delete(listener)
		}
	}, [])
	return snapshot
}

/** فقط رکوردهای همین مادر و داده نمایشی مشترک. */
export function ownedBy<T extends { motherId: string }>(items: ReadonlyArray<T>, motherId: string): T[] {
	return items.filter((item) => item.motherId === motherId || item.motherId === SHARED_DEMO_OWNER)
}

export function careId(prefix: string): string {
	return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

export function recurringKey(recurringId: string, date: string): string {
	return `${recurringId}@${date}`
}

export const careActions = {
	/* ----------------------------- فعالیت روزانه ----------------------------- */
	addActivity(activity: Omit<CareActivity, "id">) {
		commit({ ...state, activities: [{ ...activity, id: careId("act") }, ...state.activities] })
	},
	toggleActivityDone(id: string) {
		commit({
			...state,
			activities: state.activities.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
		})
	},
	deleteActivity(id: string) {
		commit({ ...state, activities: state.activities.filter((item) => item.id !== id) })
	},
	addRecurring(activity: Omit<RecurringActivity, "id">) {
		commit({ ...state, recurring: [{ ...activity, id: careId("rec") }, ...state.recurring] })
	},
	toggleRecurringActive(id: string) {
		commit({
			...state,
			recurring: state.recurring.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
		})
	},
	deleteRecurring(id: string) {
		commit({
			...state,
			recurring: state.recurring.filter((item) => item.id !== id),
			recurringDone: state.recurringDone.filter((key) => !key.startsWith(`${id}@`)),
		})
	},
	toggleRecurringDone(id: string, date: string) {
		const key = recurringKey(id, date)
		const has = state.recurringDone.includes(key)
		commit({
			...state,
			recurringDone: has ? state.recurringDone.filter((item) => item !== key) : [...state.recurringDone, key],
		})
	},

	/* -------------------------------- نوبت‌ها -------------------------------- */
	addAppointment(appointment: Omit<Appointment, "id">) {
		commit({ ...state, appointments: [{ ...appointment, id: careId("apt") }, ...state.appointments] })
	},
	setAppointmentStatus(id: string, status: AppointmentStatus) {
		commit({
			...state,
			appointments: state.appointments.map((item) => (item.id === id ? { ...item, status } : item)),
		})
	},
	deleteAppointment(id: string) {
		commit({ ...state, appointments: state.appointments.filter((item) => item.id !== id) })
	},

	/* ------------------------------ وضعیت سلامت ------------------------------ */
	addHealthRecord(record: Omit<HealthRecord, "id">) {
		commit({ ...state, healthRecords: [{ ...record, id: careId("hlt") }, ...state.healthRecords] })
	},
	deleteHealthRecord(id: string) {
		commit({ ...state, healthRecords: state.healthRecords.filter((item) => item.id !== id) })
	},

	/* -------------------------------- چکاپ‌ها -------------------------------- */
	addCheckup(checkup: Omit<CareCheckup, "id">) {
		commit({ ...state, checkups: [{ ...checkup, id: careId("chk") }, ...state.checkups] })
	},
	toggleCheckupDone(id: string) {
		commit({
			...state,
			checkups: state.checkups.map((item) => (item.id === id ? { ...item, done: !item.done } : item)),
		})
	},
	deleteCheckup(id: string) {
		commit({ ...state, checkups: state.checkups.filter((item) => item.id !== id) })
	},

	/* ----------------------------- سلامت کودک ----------------------------- */
	addChild(child: Omit<CareChild, "id">) {
		const id = careId("cld")
		commit({ ...state, children: [...state.children, { ...child, id }] })
		return id
	},
	addMedicalRecord(record: Omit<ChildMedicalRecord, "id">) {
		commit({ ...state, medicalRecords: [{ ...record, id: careId("cmr") }, ...state.medicalRecords] })
	},
	deleteMedicalRecord(id: string) {
		commit({ ...state, medicalRecords: state.medicalRecords.filter((item) => item.id !== id) })
	},

	/** بازگرداندن داده نمایشی بخش مراقبت به حالت اول. */
	resetCare() {
		commit(initialState())
	},
}
