/**
 * «سابقه بیماری و درمان کودک».
 *
 * توجه: موجودیت کودک در این فایل نگهداری نمی‌شود.
 * منبع یکتای کودک db.children است و هر سابقه فقط با childId به همان پرونده وصل می‌شود.
 * این بخش فقط ثبت سابقه است؛ سامانه هیچ دارویی توصیه نمی‌کند.
 */

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
	createdAt: string
}

export type ChildRecordSeedTemplate = {
	key: string
	/** کودک نمایشی از داده اصلی (db.children) */
	childId: string
	illness: string
	diagnosis: string
	treatment: string
	medicationList: string[]
	doctorNotes: string
	startDayOffset: number
	endDayOffset: number | null
}

export const CHILD_RECORD_SEED_TEMPLATES: ReadonlyArray<ChildRecordSeedTemplate> = [
	{
		key: "cmr-1",
		childId: "ch_1",
		illness: "سرماخوردگی",
		diagnosis: "عفونت ویروسی خفیف دستگاه تنفسی فوقانی",
		treatment: "استراحت، مایعات کافی و شست‌وشوی بینی با سالین",
		medicationList: ["قطره سالین بینی (طبق دستور پزشک)"],
		doctorNotes: "در صورت تب بالای ۳۸.۵ درجه یا تنگی نفس مراجعه فوری شود.",
		startDayOffset: -30,
		endDayOffset: -24,
	},
]
