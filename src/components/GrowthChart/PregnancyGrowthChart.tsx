import { useMemo, useState } from "react"
import { SegmentedControl } from "../../shared/components/SegmentedControl"
import { SmoothLineChart } from "../../shared/components/SmoothLineChart"
import type { SmoothChartPoint } from "../../shared/components/SmoothLineChart"
import { Icon } from "../../shared/components/icons"
import type { IconName } from "../../shared/components/icons"
import { FIRST_GROWTH_WEEK, getFetalGrowth, getGrowthSeries } from "../../data/fetalGrowth"
import type { FetalGrowthPoint } from "../../data/fetalGrowth"
import { toFa } from "../../shared/utils/date"
import "./PregnancyGrowthChart.css"

/**
 * «نمودار رشد کوچولو»: روند وزن، قد و دور سر جنین تا هفته جاری.
 * اعداد میانگین عمومی هستند و جنبه آموزشی دارند.
 */
type MetricKey = "weight" | "length" | "head"

type MetricConfig = {
	key: MetricKey
	label: string
	cardLabel: string
	unit: string
	icon: IconName
	description: string
	select: (point: FetalGrowthPoint) => number
	format: (value: number) => string
}

const METRICS: ReadonlyArray<MetricConfig> = [
	{
		key: "weight",
		label: "وزن",
		cardLabel: "وزن فعلی",
		unit: "گرم",
		icon: "weight",
		description: "وزن تقریبی کوچولو در این هفته",
		select: (point) => point.weightGrams,
		format: (value) => `${toFa(Math.round(value))} گرم`,
	},
	{
		key: "length",
		label: "قد",
		cardLabel: "قد فعلی",
		unit: "سانتی‌متر",
		icon: "ruler",
		description: "از فرق سر تا پاشنه پا",
		select: (point) => point.lengthCm,
		format: (value) => `${toFa(Math.round(value * 10) / 10)} سانتی‌متر`,
	},
	{
		key: "head",
		label: "دور سر",
		cardLabel: "دور سر فعلی",
		unit: "سانتی‌متر",
		icon: "head",
		description: "اندازه تقریبی دور سر",
		select: (point) => point.headCm,
		format: (value) => `${toFa(Math.round(value * 10) / 10)} سانتی‌متر`,
	},
]

export function PregnancyGrowthChart({ week }: { week: number }) {
	const [metricKey, setMetricKey] = useState<MetricKey>("weight")
	const metric = METRICS.find((item) => item.key === metricKey) ?? METRICS[0]!

	const series = useMemo(() => getGrowthSeries(week), [week])
	const current = getFetalGrowth(week)

	const points: SmoothChartPoint[] = useMemo(
		() =>
			series.map((point) => ({
				label: `هفته ${toFa(point.week)}`,
				value: metric.select(point),
				caption: undefined,
			})),
		[series, metric],
	)

	const tooEarly = week < FIRST_GROWTH_WEEK || series.length < 2

	return (
		<section className="pgc">
			<header className="pgc__head">
				<div className="pgc__titles">
					<h2 className="pgc__title">نمودار رشد</h2>
					<p className="pgc__subtitle">روند تغییرات رشد کوچولوی شما</p>
				</div>
				<SegmentedControl
					value={metricKey}
					onChange={(value) => setMetricKey(value as MetricKey)}
					label="انتخاب شاخص رشد"
					options={METRICS.map((item) => ({
						value: item.key,
						label: item.label,
						icon: item.icon,
					}))}
				/>
			</header>

			<div className="pgc__cards">
				{METRICS.map((item) => {
					const value = current ? item.select(current) : null
					const isActive = item.key === metricKey
					const display =
						value === null
							? "—"
							: item.key === "weight"
								? toFa(Math.round(value))
								: toFa(Math.round(value * 10) / 10)
					return (
						<button
							key={item.key}
							type="button"
							className={`pgc__card${isActive ? " is-active" : ""}`}
							onClick={() => setMetricKey(item.key)}
							aria-pressed={isActive}
						>
							<span className="pgc__card-icon">
								<Icon name={item.icon} size={18} />
							</span>
							<span className="pgc__card-body">
								<span className="pgc__card-label">{item.cardLabel}</span>
								<span className="pgc__card-value">
									{display}
									<span className="pgc__card-unit">{item.unit}</span>
								</span>
								<span className="pgc__card-desc">{item.description}</span>
							</span>
						</button>
					)
				})}
			</div>

			{tooEarly ? (
				<p className="pgc__notice">
					روند رشد از هفته {toFa(FIRST_GROWTH_WEEK)} به بعد نمایش داده می‌شود.
				</p>
			) : (
				<SmoothLineChart
					key={metric.key}
					points={points}
					formatValue={metric.format}
					ariaLabel={`نمودار ${metric.label} کوچولو تا هفته ${toFa(week)}`}
				/>
			)}

			<p className="pgc__disclaimer">
				این اعداد میانگین تقریبی و آموزشی هستند و جایگزین سونوگرافی یا نظر پزشک نیستند.
			</p>
		</section>
	)
}
