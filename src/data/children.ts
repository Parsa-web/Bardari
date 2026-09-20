/**
 * داده و انواع «پرونده سلامت کودک» پس از تولد.
 * این بخش فقط ثبت سابقه است؛ سامانه هیچ دارویی توصیه نمی‌کند.
 */

import { todayIso, addDays } from "../shared/utils/date"

export type CareChild = {
	id: string
	motherId: string
	name: string
	birthDate: string
}

export type ChildMedicalRecord = {
	id: string
	childId: string
	illness: string
	diagnosis: string
	treatment: string
	medicationList: string[]
	doctorNotes: string
	startDate: string
	endDate: string
}

const TODAY = todayIso()

export const SEED_CARE_CHILDREN: ReadonlyArray<CareChild> = [
	{
		id: "cld-seed-1",
		motherId: "*",
		name: "آوا",
		birthDate: addDays(TODAY, -420),
	},
]

export const SEED_CHILD_RECORDS: ReadonlyArray<ChildMedicalRecord> = [
	{
		id: "cmr-seed-1",
		childId: "cld-seed-1",
		illness: "سرماخوردگی",
		diagnosis: "عفونت ویروسی خفیف دستگاه تنفسی فوقانی",
		treatment: "استراحت، مایعات کافی و شست‌وشوی بینی با سالین",
		medicationList: ["قطره سالین بینی (طبق دستور پزشک)"],
		doctorNotes: "در صورت تب بالای ۳۸.۵ درجه یا تنگی نفس مراجعه فوری شود.",
		startDate: addDays(TODAY, -30),
		endDate: addDays(TODAY, -24),
	},
]
