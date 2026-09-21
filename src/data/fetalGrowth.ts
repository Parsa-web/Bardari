/**
 * جدول مرجع تقریبی رشد جنین بر اساس هفته بارداری.
 * این اعداد میانگین عمومی هستند و جایگزین سونوگرافی یا نظر پزشک نیستند.
 * - weightGrams: وزن تقریبی (گرم)
 * - lengthCm: قد تقریبی (سانتی‌متر)
 * - headCm: دور سر تقریبی (سانتی‌متر)
 */
export type FetalGrowthPoint = {
	week: number
	weightGrams: number
	lengthCm: number
	headCm: number
}

export const FETAL_GROWTH: ReadonlyArray<FetalGrowthPoint> = [
	{ week: 12, weightGrams: 14, lengthCm: 8.5, headCm: 7 },
	{ week: 13, weightGrams: 23, lengthCm: 10, headCm: 8.4 },
	{ week: 14, weightGrams: 43, lengthCm: 12, headCm: 9.7 },
	{ week: 15, weightGrams: 70, lengthCm: 14, headCm: 11 },
	{ week: 16, weightGrams: 100, lengthCm: 16, headCm: 12.4 },
	{ week: 17, weightGrams: 140, lengthCm: 18, headCm: 13.7 },
	{ week: 18, weightGrams: 190, lengthCm: 20.5, headCm: 15 },
	{ week: 19, weightGrams: 240, lengthCm: 23, headCm: 16.3 },
	{ week: 20, weightGrams: 300, lengthCm: 25, headCm: 17.5 },
	{ week: 21, weightGrams: 360, lengthCm: 26.7, headCm: 18.7 },
	{ week: 22, weightGrams: 430, lengthCm: 27.8, headCm: 19.9 },
	{ week: 23, weightGrams: 501, lengthCm: 28.9, headCm: 21 },
	{ week: 24, weightGrams: 600, lengthCm: 30, headCm: 22.1 },
	{ week: 25, weightGrams: 660, lengthCm: 31.5, headCm: 23.2 },
	{ week: 26, weightGrams: 760, lengthCm: 33, headCm: 24.2 },
	{ week: 27, weightGrams: 875, lengthCm: 34.5, headCm: 25.2 },
	{ week: 28, weightGrams: 1005, lengthCm: 36, headCm: 26.2 },
	{ week: 29, weightGrams: 1153, lengthCm: 37.5, headCm: 27.1 },
	{ week: 30, weightGrams: 1319, lengthCm: 39, headCm: 28 },
	{ week: 31, weightGrams: 1502, lengthCm: 40.3, headCm: 28.8 },
	{ week: 32, weightGrams: 1702, lengthCm: 41.6, headCm: 29.6 },
	{ week: 33, weightGrams: 1918, lengthCm: 43, headCm: 30.4 },
	{ week: 34, weightGrams: 2146, lengthCm: 44.3, headCm: 31.1 },
	{ week: 35, weightGrams: 2383, lengthCm: 45.6, headCm: 31.8 },
	{ week: 36, weightGrams: 2622, lengthCm: 47, headCm: 32.5 },
	{ week: 37, weightGrams: 2859, lengthCm: 48.3, headCm: 33.1 },
	{ week: 38, weightGrams: 3083, lengthCm: 49.5, headCm: 33.7 },
	{ week: 39, weightGrams: 3288, lengthCm: 50.5, headCm: 34.2 },
	{ week: 40, weightGrams: 3462, lengthCm: 51.5, headCm: 34.7 },
]

export const FIRST_GROWTH_WEEK = 12
export const LAST_GROWTH_WEEK = 40

/** نزدیک‌ترین رکورد مرجع برای یک هفته مشخص. */
export function getFetalGrowth(week: number): FetalGrowthPoint | undefined {
	if (!Number.isFinite(week)) return undefined
	const clamped = Math.min(Math.max(Math.round(week), FIRST_GROWTH_WEEK), LAST_GROWTH_WEEK)
	return FETAL_GROWTH.find((point) => point.week === clamped)
}

/** روند رشد تا هفته جاری (برای رسم نمودار). */
export function getGrowthSeries(week: number): ReadonlyArray<FetalGrowthPoint> {
	const clamped = Math.min(Math.max(Math.round(week), FIRST_GROWTH_WEEK), LAST_GROWTH_WEEK)
	return FETAL_GROWTH.filter((point) => point.week <= clamped)
}
