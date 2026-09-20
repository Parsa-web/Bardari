/**
 * تبدیل تقویم هجری شمسی و میلادی (الگوریتم بورکوفسکی).
 * ذخیره‌سازی داده همچنان ISO میلادی (YYYY-MM-DD) است تا محاسبات و مرتب‌سازی دقیق بماند؛
 * ورود و نمایش همیشه شمسی است.
 */

export type JalaliDate = { jy: number; jm: number; jd: number }

export const JALALI_MONTHS = [
	"فروردین",
	"اردیبهشت",
	"خرداد",
	"تیر",
	"مرداد",
	"شهریور",
	"مهر",
	"آبان",
	"آذر",
	"دی",
	"بهمن",
	"اسفند",
] as const

const BREAKS = [
	-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
	2456, 3178,
]

function div(a: number, b: number): number {
	return Math.trunc(a / b)
}

function mod(a: number, b: number): number {
	return a - Math.trunc(a / b) * b
}

type JalCal = { leap: number; gy: number; march: number }

function jalCal(jy: number): JalCal {
	const gy = jy + 621
	let leapJ = -14
	let jp = BREAKS[0]
	let jump = 0

	if (jy < jp || jy >= BREAKS[BREAKS.length - 1]) {
		throw new RangeError(`سال شمسی نامعتبر: ${jy}`)
	}

	for (let i = 1; i < BREAKS.length; i += 1) {
		const jm = BREAKS[i]
		jump = jm - jp
		if (jy < jm) break
		leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4)
		jp = jm
	}

	let n = jy - jp
	leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4)
	if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1

	const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150
	const march = 20 + leapJ - leapG

	if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33
	let leap = mod(mod(n + 1, 33) - 1, 4)
	if (leap === -1) leap = 4

	return { leap, gy, march }
}

function gregorianToDayNumber(gy: number, gm: number, gd: number): number {
	let d =
		div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
		div(153 * mod(gm + 9, 12) + 2, 5) +
		gd -
		34840408
	d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752
	return d
}

function dayNumberToGregorian(dayNumber: number): { gy: number; gm: number; gd: number } {
	let j = 4 * dayNumber + 139361631
	j = j + div(div(4 * dayNumber + 183187720, 146097) * 3, 4) * 4 - 3908
	const i = div(mod(j, 1461), 4) * 5 + 308
	const gd = div(mod(i, 153), 5) + 1
	const gm = mod(div(i, 153), 12) + 1
	const gy = div(j, 1461) - 100100 + div(8 - gm, 6)
	return { gy, gm, gd }
}

function jalaliToDayNumber(jy: number, jm: number, jd: number): number {
	const calendar = jalCal(jy)
	return (
		gregorianToDayNumber(calendar.gy, 3, calendar.march) +
		(jm - 1) * 31 -
		div(jm, 7) * (jm - 7) +
		jd -
		1
	)
}

function dayNumberToJalali(dayNumber: number): JalaliDate {
	const gregorian = dayNumberToGregorian(dayNumber)
	let jy = gregorian.gy - 621
	const calendar = jalCal(jy)
	const firstDayOfYear = gregorianToDayNumber(gregorian.gy, 3, calendar.march)
	let k = dayNumber - firstDayOfYear

	if (k >= 0) {
		if (k <= 185) {
			return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 }
		}
		k -= 186
	} else {
		jy -= 1
		k += 179
		if (calendar.leap === 1) k += 1
	}

	return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 }
}

/** آیا سال شمسی کبیسه است؟ */
export function isJalaliLeapYear(jy: number): boolean {
	try {
		return jalCal(jy).leap === 0
	} catch {
		return false
	}
}

/** تعداد روزهای ماه شمسی (اسفند ۲۹ یا ۳۰ روز) */
export function jalaliMonthLength(jy: number, jm: number): number {
	if (jm <= 6) return 31
	if (jm <= 11) return 30
	return isJalaliLeapYear(jy) ? 30 : 29
}

export function isValidJalaliDate(jy: number, jm: number, jd: number): boolean {
	if (!Number.isInteger(jy) || !Number.isInteger(jm) || !Number.isInteger(jd)) return false
	if (jy < -61 || jy > 3177) return false
	if (jm < 1 || jm > 12) return false
	if (jd < 1) return false
	return jd <= jalaliMonthLength(jy, jm)
}

/** تبدیل ISO میلادی به شمسی؛ ورودی نامعتبر یعنی null */
export function isoToJalali(iso?: string | null): JalaliDate | null {
	if (!iso) return null
	const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
	if (!match) return null
	const gy = Number(match[1])
	const gm = Number(match[2])
	const gd = Number(match[3])
	if (gm < 1 || gm > 12 || gd < 1 || gd > 31) return null
	try {
		return dayNumberToJalali(gregorianToDayNumber(gy, gm, gd))
	} catch {
		return null
	}
}

/** تبدیل تاریخ شمسی به ISO میلادی؛ ورودی نامعتبر یعنی null */
export function jalaliToIso(jy: number, jm: number, jd: number): string | null {
	if (!isValidJalaliDate(jy, jm, jd)) return null
	try {
		const { gy, gm, gd } = dayNumberToGregorian(jalaliToDayNumber(jy, jm, jd))
		return `${String(gy).padStart(4, "0")}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`
	} catch {
		return null
	}
}

export function todayJalali(): JalaliDate {
	const now = new Date()
	return dayNumberToJalali(
		gregorianToDayNumber(now.getFullYear(), now.getMonth() + 1, now.getDate()),
	)
}

/** ماه و سال شمسی یک تاریخ، برای گروه‌بندی فهرست‌ها */
export function jalaliMonthKey(iso?: string | null): string | null {
	const parts = isoToJalali(iso)
	if (!parts) return null
	return `${parts.jy}-${String(parts.jm).padStart(2, "0")}`
}
