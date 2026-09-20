import { formatDate, toFa } from "../utils/date"

/**
 * نمودار خطی ساده و بدون وابستگی خارجی، برای نمایش روند رشد.
 * محور زمان راست‌به‌چپ است (قدیمی‌ترین سمت راست) تا با جهت RTL هماهنگ باشد.
 */
export type ChartPoint = { date: string; value: number }

const WIDTH = 640
const HEIGHT = 240
const PAD_X = 44
const PAD_TOP = 18
const PAD_BOTTOM = 34

export function GrowthChart({
	points,
	unit,
	empty = "داده‌ای برای رسم نمودار ثبت نشده است.",
}: {
	points: ChartPoint[]
	unit: string
	empty?: string
}) {
	if (points.length === 0) {
		return <p className="chart__empty">{empty}</p>
	}

	const values = points.map((point) => point.value)
	const rawMin = Math.min(...values)
	const rawMax = Math.max(...values)
	const span = rawMax - rawMin
	const pad = span === 0 ? Math.max(Math.abs(rawMax) * 0.1, 1) : span * 0.15
	const min = rawMin - pad
	const max = rawMax + pad

	const plotWidth = WIDTH - PAD_X * 2
	const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM

	const xFor = (index: number) => {
		if (points.length === 1) return WIDTH / 2
		// معکوس می‌کنیم تا قدیمی‌ترین نقطه سمت راست قرار بگیرد
		return WIDTH - PAD_X - (index / (points.length - 1)) * plotWidth
	}
	const yFor = (value: number) =>
		PAD_TOP + plotHeight - ((value - min) / (max - min)) * plotHeight

	const line = points
		.map((point, index) => `${index === 0 ? "M" : "L"}${xFor(index).toFixed(1)},${yFor(point.value).toFixed(1)}`)
		.join(" ")

	const area = `${line} L${xFor(points.length - 1).toFixed(1)},${(PAD_TOP + plotHeight).toFixed(1)} L${xFor(0).toFixed(1)},${(PAD_TOP + plotHeight).toFixed(1)} Z`

	const gridValues = [max, (max + min) / 2, min]

	return (
		<figure className="chart">
			<svg
				className="chart__svg"
				viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
				role="img"
				aria-label={`نمودار روند بر حسب ${unit}`}
				preserveAspectRatio="none"
			>
				{gridValues.map((value, index) => {
					const y = yFor(value)
					return (
						<g key={index}>
							<line
								className="chart__grid"
								x1={PAD_X}
								x2={WIDTH - PAD_X}
								y1={y}
								y2={y}
							/>
							<text className="chart__axis" x={WIDTH - 6} y={y - 4} textAnchor="end">
								{toFa(Math.round(value * 10) / 10)}
							</text>
						</g>
					)
				})}

				{points.length > 1 && <path className="chart__area" d={area} />}
				{points.length > 1 && <path className="chart__line" d={line} />}

				{points.map((point, index) => (
					<circle
						key={`${point.date}-${index}`}
						className="chart__dot"
						cx={xFor(index)}
						cy={yFor(point.value)}
						r={4}
					>
						<title>{`${formatDate(point.date)} — ${toFa(point.value)} ${unit}`}</title>
					</circle>
				))}
			</svg>
			<figcaption className="chart__caption">
				<span>قدیمی‌ترین: {formatDate(points[0]?.date)}</span>
				<span>واحد: {unit}</span>
				<span>تازه‌ترین: {formatDate(points[points.length - 1]?.date)}</span>
			</figcaption>
		</figure>
	)
}
