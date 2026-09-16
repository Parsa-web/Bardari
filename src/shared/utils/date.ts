/**
 * ابزارهای تاریخ و زمان.
 * تاریخ‌ها به‌صورت ISO (YYYY-MM-DD) ذخیره می‌شوند و برای نمایش به تقویم شمسی تبدیل می‌شوند.
 */

const FA_LOCALE = "fa-IR-u-ca-persian"

const shortDateFormatter = new Intl.DateTimeFormat(FA_LOCALE, {
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
})

const longDateFormatter = new Intl.DateTimeFormat(FA_LOCALE, {
	weekday: "long",
	year: "numeric",
	month: "long",
	day: "numeric",
})

const monthDayFormatter = new Intl.DateTimeFormat(FA_LOCALE, {
	month: "long",
	day: "numeric",
})

/** تبدیل عدد یا رشته عددی به ارقام فارسی */
export function toFa(value: number | string): string {
	return String(value).replace(/\d/g, (digit) =>
		String.fromCharCode(0x06f0 + Number(digit)),
	)
}

export function parseIsoDate(iso?: string | null): Date | null {
	if (!iso) return null
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
	if (!match) {
		const parsed = new Date(iso)
		return Number.isNaN(parsed.getTime()) ? null : parsed
	}
	const date = new Date(
		Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
	)
	return Number.isNaN(date.getTime()) ? null : date
}

export function toIsoDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

export function todayIso(): string {
	return toIsoDate(new Date())
}

export function nowTime(): string {
	const now = new Date()
	return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
}

export function nowIsoTimestamp(): string {
	return new Date().toISOString()
}

export function addDays(iso: string, days: number): string {
	const date = parseIsoDate(iso)
	if (!date) return iso
	date.setUTCDate(date.getUTCDate() + days)
	return date.toISOString().slice(0, 10)
}

/** تعداد روز از تاریخ اول تا تاریخ دوم (مقدار مثبت = دوم بعد از اول است) */
export function diffInDays(fromIso: string, toIso: string): number | null {
	const from = parseIsoDate(fromIso)
	const to = parseIsoDate(toIso)
	if (!from || !to) return null
	const ms = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) -
		Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
	return Math.round(ms / 86_400_000)
}

/** روزهای باقی‌مانده تا تاریخ مقصد؛ منفی یعنی گذشته است */
export function daysUntil(iso: string): number | null {
	return diffInDays(todayIso(), iso)
}

export function formatDate(iso?: string | null): string {
	const date = parseIsoDate(iso)
	if (!date) return "—"
	return shortDateFormatter.format(date)
}

export function formatDateLong(iso?: string | null): string {
	const date = parseIsoDate(iso)
	if (!date) return "—"
	return longDateFormatter.format(date)
}

export function formatMonthDay(iso?: string | null): string {
	const date = parseIsoDate(iso)
	if (!date) return "—"
	return monthDayFormatter.format(date)
}

export function formatTime(time?: string | null): string {
	if (!time) return "—"
	return toFa(time)
}

export function formatDateTime(iso?: string | null, time?: string | null): string {
	const date = formatDate(iso)
	if (!time) return date
	return `${date} — ساعت ${toFa(time)}`
}

/** تاریخ و ساعت یک timestamp کامل */
export function formatTimestamp(timestamp?: string | null): string {
	if (!timestamp) return "—"
	const date = new Date(timestamp)
	if (Number.isNaN(date.getTime())) return "—"
	const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
	return `${shortDateFormatter.format(date)} — ساعت ${toFa(time)}`
}

export type AgeParts = { years: number; months: number; days: number; totalDays: number }

/** سن دقیق بر اساس تاریخ تولد (سال/ماه/روز تقویمی) */
export function ageParts(birthIso?: string | null, referenceIso?: string): AgeParts | null {
	const birth = parseIsoDate(birthIso)
	const reference = parseIsoDate(referenceIso ?? todayIso())
	if (!birth || !reference) return null
	const totalDays = diffInDays(birthIso as string, referenceIso ?? todayIso())
	if (totalDays === null || totalDays < 0) return null

	let years = reference.getUTCFullYear() - birth.getUTCFullYear()
	let months = reference.getUTCMonth() - birth.getUTCMonth()
	let days = reference.getUTCDate() - birth.getUTCDate()

	if (days < 0) {
		months -= 1
		const previousMonth = new Date(
			Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 0),
		)
		days += previousMonth.getUTCDate()
	}
	if (months < 0) {
		years -= 1
		months += 12
	}
	return { years, months, days, totalDays }
}

/** نمایش فارسی سن، مثل «۳ ماه و ۱۲ روز» */
export function formatAge(birthIso?: string | null): string {
	const parts = ageParts(birthIso)
	if (!parts) return "—"
	const chunks: string[] = []
	if (parts.years > 0) chunks.push(`${toFa(parts.years)} سال`)
	if (parts.months > 0) chunks.push(`${toFa(parts.months)} ماه`)
	if (parts.days > 0 || chunks.length === 0) chunks.push(`${toFa(parts.days)} روز`)
	return chunks.join(" و ")
}

/** سن به ماه، برای مقایسه با milestoneها */
export function ageInMonths(birthIso?: string | null): number | null {
	const parts = ageParts(birthIso)
	if (!parts) return null
	return parts.years * 12 + parts.months
}

export type Gestation = { weeks: number; days: number; trimester: 1 | 2 | 3; eddDate: string }

/**
 * محاسبه هفته بارداری از تاریخ‌های معتبر.
 * اگر داده کافی نباشد null برمی‌گردد و UI باید «اطلاعات ثبت نشده» نمایش دهد.
 */
export function gestation(input: {
	lmpDate?: string | null
	eddDate?: string | null
}): Gestation | null {
	const today = todayIso()
	let elapsedDays: number | null = null
	let eddDate: string | null = null

	if (input.lmpDate) {
		elapsedDays = diffInDays(input.lmpDate, today)
		eddDate = input.eddDate ?? addDays(input.lmpDate, 280)
	} else if (input.eddDate) {
		const remaining = diffInDays(today, input.eddDate)
		if (remaining !== null) elapsedDays = 280 - remaining
		eddDate = input.eddDate
	}

	if (elapsedDays === null || eddDate === null) return null
	if (elapsedDays < 0 || elapsedDays > 315) return null

	const weeks = Math.floor(elapsedDays / 7)
	const days = elapsedDays % 7
	const trimester: 1 | 2 | 3 = weeks < 14 ? 1 : weeks < 28 ? 2 : 3
	return { weeks, days, trimester, eddDate }
}

export function formatGestation(value: Gestation | null): string {
	if (!value) return "اطلاعات ثبت نشده"
	if (value.days === 0) return `هفته ${toFa(value.weeks)}`
	return `هفته ${toFa(value.weeks)} و ${toFa(value.days)} روز`
}

/** مقایسه دو رکورد بر اساس تاریخ و ساعت، برای مرتب‌سازی */
export function compareDateTime(
	a: { date: string; time?: string | null },
	b: { date: string; time?: string | null },
): number {
	if (a.date !== b.date) return a.date < b.date ? -1 : 1
	const timeA = a.time ?? ""
	const timeB = b.time ?? ""
	if (timeA === timeB) return 0
	return timeA < timeB ? -1 : 1
}
