import { SmoothLineChart } from "./SmoothLineChart"
import type { SmoothChartPoint } from "./SmoothLineChart"
import { formatDate, toFa } from "../utils/date"

/**
 * نمودار رشد عمومی (مثلاً رشد کودک).
 * از نمودار مشترک SmoothLineChart استفاده می‌کند تا زبان بصری یکسان بماند.
 * API قبلی حفظ شده است تا صفحات موجود بدون تغییر کار کنند.
 */
export function GrowthChart({
	points,
	unit,
	empty = "داده‌ای برای رسم نمودار ثبت نشده است.",
}: {
	points: ReadonlyArray<{ date: string; value: number }>
	unit: string
	empty?: string
}) {
	const chartPoints: SmoothChartPoint[] = points.map((point) => ({
		label: formatDate(point.date),
		value: point.value,
	}))

	return (
		<SmoothLineChart
			points={chartPoints}
			empty={empty}
			ariaLabel={`نمودار روند تغییرات (${unit})`}
			formatValue={(value) => `${toFa(Math.round(value * 10) / 10)} ${unit}`}
		/>
	)
}
