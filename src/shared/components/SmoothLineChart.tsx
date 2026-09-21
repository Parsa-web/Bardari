import { useId, useMemo, useState } from "react"
import "./SmoothLineChart.css"

/**
 * نمودار خطی نرم و قابل استفاده دوباره (بدون وابستگی خارجی).
 * زبان بصری: منحنی نرم، سطح گرادیانی زیر خط، نقاط گرد و تولتیپ لمسی.
 * محور زمان راست‌به‌چپ است: قدیمی‌ترین نقطه سمت راست.
 *
 * مختصات در فضای ۰تا۱۰۰ محاسبه می‌شود تا هم SVG و هم نقاط HTML
 * با هر اندازه‌ای از کانتینر دقیق روی هم بیفتند (بدون اسکرول افقی).
 */
export type SmoothChartPoint = {
	label: string
	value: number
	caption?: string
}

const X_START = 94
const X_SPAN = 88
const Y_TOP = 14
const Y_SPAN = 68

function buildPath(coords: Array<{ x: number; y: number }>) {
	if (coords.length < 2) return ""
	const first = coords[0]!
	let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`
	for (let index = 0; index < coords.length - 1; index += 1) {
		const p0 = coords[index - 1] ?? coords[index]!
		const p1 = coords[index]!
		const p2 = coords[index + 1]!
		const p3 = coords[index + 2] ?? p2
		const c1x = p1.x + (p2.x - p0.x) / 6
		const c1y = p1.y + (p2.y - p0.y) / 6
		const c2x = p2.x - (p3.x - p1.x) / 6
		const c2y = p2.y - (p3.y - p1.y) / 6
		d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
	}
	return d
}

export function SmoothLineChart({
	points,
	formatValue,
	ariaLabel,
	empty = "داده‌ای برای رسم نمودار ثبت نشده است.",
	maxDots = 8,
}: {
	points: ReadonlyArray<SmoothChartPoint>
	formatValue: (value: number) => string
	ariaLabel?: string
	empty?: string
	maxDots?: number
}) {
	const gradientId = useId().replace(/:/g, "")
	const [picked, setPicked] = useState<number | null>(null)

	const geometry = useMemo(() => {
		const count = points.length
		if (count === 0) return null
		const values = points.map((point) => point.value)
		const rawMin = Math.min(...values)
		const rawMax = Math.max(...values)
		const span = rawMax - rawMin
		const pad = span === 0 ? Math.max(Math.abs(rawMax) * 0.1, 1) : span * 0.16
		const min = rawMin - pad
		const max = rawMax + pad
		const coords = points.map((point, index) => ({
			x: count === 1 ? 50 : X_START - (index / (count - 1)) * X_SPAN,
			y: Y_TOP + (1 - (point.value - min) / (max - min)) * Y_SPAN,
		}))
		const line = buildPath(coords)
		const last = coords[coords.length - 1]!
		const first = coords[0]!
		const area = line ? `${line} L ${last.x.toFixed(2)} 96 L ${first.x.toFixed(2)} 96 Z` : ""

		/* فقط چند نقطه شاخص نمایش داده می‌شود تا نمودار شلوغ نشود. */
		const dots = new Set<number>()
		if (count <= maxDots) {
			for (let index = 0; index < count; index += 1) dots.add(index)
		} else {
			const stepCount = maxDots - 1
			for (let step = 0; step <= stepCount; step += 1) {
				dots.add(Math.round((step / stepCount) * (count - 1)))
			}
		}
		dots.add(count - 1)
		return { coords, line, area, dots }
	}, [points, maxDots])

	if (!geometry || points.length === 0) {
		return <p className="slchart__empty">{empty}</p>
	}

	const activeIndex =
		picked !== null && picked >= 0 && picked < points.length ? picked : points.length - 1
	const activePoint = points[activeIndex]!
	const activeCoord = geometry.coords[activeIndex]!

	return (
		<div className="slchart" role="img" aria-label={ariaLabel}>
			<div className="slchart__canvas">
				<svg className="slchart__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
					<defs>
						<linearGradient id={`fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
							<stop className="slchart__stop-top" offset="0%" />
							<stop className="slchart__stop-bottom" offset="100%" />
						</linearGradient>
						<linearGradient id={`stroke-${gradientId}`} x1="1" y1="0" x2="0" y2="0">
							<stop className="slchart__stroke-start" offset="0%" />
							<stop className="slchart__stroke-end" offset="100%" />
						</linearGradient>
					</defs>
					{geometry.area && <path className="slchart__area" d={geometry.area} fill={`url(#fill-${gradientId})`} />}
					{geometry.line && (
						<path
							className="slchart__line"
							d={geometry.line}
							fill="none"
							stroke={`url(#stroke-${gradientId})`}
							strokeWidth={2.6}
							strokeLinecap="round"
							strokeLinejoin="round"
							vectorEffect="non-scaling-stroke"
						/>
					)}
				</svg>

				{/* نقطه فعال: خط راهنمای ملایم */}
				<span
					className="slchart__guide"
					style={{ left: `${activeCoord.x}%`, top: `${activeCoord.y}%` }}
					aria-hidden="true"
				/>

				{geometry.coords.map((coord, index) => {
					if (!geometry.dots.has(index) && index !== activeIndex) return null
					const point = points[index]!
					return (
						<button
							key={`${point.label}-${index}`}
							type="button"
							className={`slchart__dot${index === activeIndex ? " is-active" : ""}`}
							style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
							onClick={() => setPicked(index)}
							onMouseEnter={() => setPicked(index)}
							aria-label={`${point.label}: ${formatValue(point.value)}`}
						/>
					)
				})}

				<div
					className="slchart__tooltip"
					style={{ left: `${activeCoord.x}%`, top: `${activeCoord.y}%` }}
					key={`${activeIndex}-${activePoint.label}`}
				>
					<span className="slchart__tooltip-label">{activePoint.label}</span>
					<strong className="slchart__tooltip-value">{formatValue(activePoint.value)}</strong>
					{activePoint.caption && <span className="slchart__tooltip-caption">{activePoint.caption}</span>}
				</div>
			</div>

			<div className="slchart__axis">
				<span>{points[points.length - 1]?.label}</span>
				<span>{points[0]?.label}</span>
			</div>
		</div>
	)
}
