import {
	clampPregnancyWeek,
	MAX_PREGNANCY_WEEK,
	MIN_PREGNANCY_WEEK,
} from "../data/pregnancyWeeks"

/** یک نقطه روی تایم‌لاین سفر بارداری. */
export type PregnancyTimelinePoint = {
	week: number
	/** هفته‌ای که هم‌اکنون در کارت نمایش داده می‌شود. */
	isActive: boolean
	/** هفته واقعی بارداری مادر. */
	isCurrent: boolean
	/** هفته‌ای که پشت سر گذاشته شده است. */
	isPast: boolean
}

/** درصد پیشرفت بارداری (۰ تا ۱۰۰). */
export function pregnancyProgress(week: number): number {
	const safe = clampPregnancyWeek(week)
	return Math.min(100, Math.max(0, Math.round((safe / MAX_PREGNANCY_WEEK) * 100)))
}

/** سه‌ماهه مربوط به هفته. */
export function trimesterLabel(week: number): string {
	const safe = clampPregnancyWeek(week)
	if (safe <= 13) return "سه‌ماهه اول"
	if (safe <= 27) return "سه‌ماهه دوم"
	return "سه‌ماهه سوم"
}

/**
 * پنج نقطه تایم‌لاین حول هفته فعال می‌سازد (مانند ۱۲ | ۱۶ | ۲۰ | ۲۴ | ۲۸)
 * تا مادر مسیر بارداری خود را ببیند.
 */
export function buildPregnancyTimeline(
	activeWeek: number,
	currentWeek: number | null,
	step = 4,
): PregnancyTimelinePoint[] {
	const active = clampPregnancyWeek(activeWeek)
	const weeks: number[] = []
	for (let offset = -2; offset <= 2; offset += 1) {
		weeks.push(clampPregnancyWeek(active + offset * step))
	}
	const unique = [...new Set(weeks)].sort((a, b) => a - b)
	// اگر به ابتدا یا انتهای بازه رسیدیم، تعداد نقاط را جبران می‌کنیم.
	let guard = 0
	while (unique.length < 5 && guard < 40) {
		guard += 1
		const first = unique[0] ?? active
		const last = unique[unique.length - 1] ?? active
		if (last + step <= MAX_PREGNANCY_WEEK) unique.push(last + step)
		else if (first - step >= MIN_PREGNANCY_WEEK) unique.unshift(first - step)
		else break
	}
	return unique.map((week) => ({
		week,
		isActive: week === active,
		isCurrent: currentWeek !== null && week === clampPregnancyWeek(currentWeek),
		isPast: week < active,
	}))
}
