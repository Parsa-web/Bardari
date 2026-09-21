import { useEffect, useMemo, useRef, useState } from "react"
import { Button, Card, EmptyState, Icon } from "../../shared/components/ui"
import {
	clampPregnancyWeek,
	getPregnancyWeek,
	MAX_PREGNANCY_WEEK,
	MIN_PREGNANCY_WEEK,
} from "../../data/pregnancyWeeks"
import { buildPregnancyTimeline, pregnancyProgress, trimesterLabel } from "../../services/pregnancyJourney"
import { toFa } from "../../shared/utils/date"
import "./BabyGrowthCard.css"

/**
 * زنجیره مسیرهای ممکن برای تصویر یک هفته.
 * اول خروجی تبدیل‌شده در بیلد (jpg)، سپس فایل خام (jfif) و در آخر تصویر پشتیبان داده‌ها.
 */
function weekImageSources(week: number, fallback?: string): string[] {
	const base = import.meta.env.BASE_URL
	const list = [`${base}weeks/${week}.jpg`, `${base}weeks/${week}.jfif`]
	if (fallback) list.push(fallback)
	return list
}

/**
 * تصویر دایره‌ای هفته.
 *
 * این کامپوننت عمداً جداست و با key={week} ساخته می‌شود تا با عوض شدن هفته
 * وضعیت بارگذاری از نو ساخته شود. مشکل قبلی این بود که بازنشانی در useEffect
 * بعد از رویداد load اجرا می‌شد و تصویر تا رفرش بعدی مخفی می‌ماند.
 */
function WeekImage({ week, alt, fallback }: { week: number; alt: string; fallback?: string }) {
	const sources = useMemo(() => weekImageSources(week, fallback), [week, fallback])
	const [index, setIndex] = useState(0)
	const [ready, setReady] = useState(false)
	const imageRef = useRef<HTMLImageElement>(null)
	const src = sources[index]

	// تصویری که از کش مرورگر می‌آید ممکن است رویداد load را قبل از اتصال شنونده فعال کند؛
	// پس وضعیت واقعی عنصر را هم مستقیم می‌خوانیم.
	useEffect(() => {
		const node = imageRef.current
		if (!node) return
		if (node.complete && node.naturalWidth > 0) {
			setReady(true)
		} else if (node.complete && node.naturalWidth === 0) {
			setIndex((value) => value + 1)
		}
	}, [src])

	// محافظ نهایی: اگر به هر دلیل رویداد load نرسید، تصویر بعد از ۱.۵ ثانیه نمایش داده می‌شود.
	useEffect(() => {
		if (ready) return undefined
		const timer = window.setTimeout(() => setReady(true), 1500)
		return () => window.clearTimeout(timer)
	}, [ready, src])

	if (!src) {
		return (
			<div className="bgc__placeholder" role="img" aria-label="تصویر این هفته هنوز اضافه نشده است">
				<span className="bgc__placeholder-icon">
					<Icon name="image" size={26} />
				</span>
				<p className="bgc__placeholder-text">تصویر این هفته به‌زودی اضافه می‌شود</p>
			</div>
		)
	}

	return (
		<>
			{!ready && <span className="bgc__orb-skeleton" aria-hidden="true" />}
			<img
				ref={imageRef}
				className={`bgc__image${ready ? " is-ready" : ""}`}
				src={src}
				alt={alt}
				loading="eager"
				decoding="async"
				draggable={false}
				onLoad={() => setReady(true)}
				onError={() => {
					setReady(false)
					setIndex((value) => value + 1)
				}}
			/>
		</>
	)
}

/**
 * کارت «رشد هفتگی کوچولو».
 * چیدمان دوستونه: پنل اطلاعات + حلقه تصویر نوزاد؛ زیر آن پیام احساسی و تایم‌لاین هفته‌ها.
 * فقط آیکن خطی مینیمال استفاده می‌شود؛ هیچ ایموجی‌ای در رابط کاربری نیست.
 *
 * نمونه استفاده: <BabyGrowthCard week={20} />
 */
export function BabyGrowthCard({ week }: { week?: number | null }) {
	const currentWeek = typeof week === "number" ? clampPregnancyWeek(week) : null
	const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
	const activeWeek = selectedWeek ?? currentWeek ?? MIN_PREGNANCY_WEEK
	const info = getPregnancyWeek(activeWeek)
	const progress = pregnancyProgress(activeWeek)
	const timeline = buildPregnancyTimeline(activeWeek, currentWeek)

	// پیش‌بارگذاری هفته قبل و بعد تا جابجایی بدون مکث باشد.
	useEffect(() => {
		const neighbors = [activeWeek - 1, activeWeek + 1].filter(
			(value) => value >= MIN_PREGNANCY_WEEK && value <= MAX_PREGNANCY_WEEK,
		)
		const images = neighbors.map((value) => {
			const image = new Image()
			image.decoding = "async"
			image.src = weekImageSources(value)[0] ?? ""
			return image
		})
		return () => {
			images.forEach((image) => {
				image.src = ""
			})
		}
	}, [activeWeek])

	const goTo = (value: number) => setSelectedWeek(clampPregnancyWeek(value))

	return (
		<Card
			title={`هفته ${toFa(activeWeek)} بارداری`}
			subtitle={`${trimesterLabel(activeWeek)} · سفر بارداری شما`}
			actions={
				currentWeek !== null && activeWeek !== currentWeek ? (
					<Button variant="ghost" size="sm" onClick={() => setSelectedWeek(null)}>
						{`بازگشت به هفته فعلی (${toFa(currentWeek)})`}
					</Button>
				) : undefined
			}
		>
			<div className="bgc">
				{!info ? (
					<EmptyState
						title="اطلاعات این هفته ثبت نشده است."
						hint="اطلاعات هفته‌های ۱ تا ۴۰ بارداری در دسترس است."
					/>
				) : (
					<>
						<div className="bgc__hero" key={activeWeek}>
							<div className="bgc__info">
								<span className="bgc__eyebrow">
									{`${trimesterLabel(activeWeek)} · هفته ${toFa(activeWeek)} از ${toFa(MAX_PREGNANCY_WEEK)}`}
									{currentWeek === activeWeek && <em className="bgc__now">هفته فعلی</em>}
								</span>
								<h3 className="bgc__title">{`هفته ${toFa(activeWeek)} بارداری`}</h3>
								<p className="bgc__subtitle">رشد کوچولوی شما</p>

								<div className="bgc__facts">
									<div className="bgc__fact">
										<span className="bgc__fact-icon">
											<Icon name="ruler" size={18} />
										</span>
										<span className="bgc__fact-body">
											<span className="bgc__fact-label">اندازه</span>
											<span className="bgc__fact-value">{info.size}</span>
										</span>
									</div>
									<div className="bgc__fact">
										<span className="bgc__fact-icon">
											<Icon name="weight" size={18} />
										</span>
										<span className="bgc__fact-body">
											<span className="bgc__fact-label">وزن</span>
											<span className="bgc__fact-value">{info.weight}</span>
										</span>
									</div>
									<div className="bgc__fact bgc__fact--wide">
										<span className="bgc__fact-icon">
											<Icon name="leaf" size={18} />
										</span>
										<span className="bgc__fact-body">
											<span className="bgc__fact-label">رشد این هفته</span>
											<span className="bgc__fact-text">{info.development}</span>
										</span>
									</div>
								</div>

								<div className="bgc__progress-wrap">
									<div
										className="bgc__progress"
										role="img"
										aria-label={`پیشرفت بارداری ${toFa(progress)} درصد`}
									>
										<span className="bgc__progress-fill" style={{ width: `${progress}%` }} />
									</div>
									<div className="bgc__progress-meta">
										<span>{`پیشرفت ${toFa(progress)}٪`}</span>
										<span>{`${toFa(Math.max(MAX_PREGNANCY_WEEK - activeWeek, 0))} هفته تا روز تولد`}</span>
									</div>
								</div>
							</div>

							<div className="bgc__visual">
								<div className="bgc__orb">
									<WeekImage
										key={activeWeek}
										week={activeWeek}
										fallback={info.image}
										alt={`تصویر رشد نوزاد در هفته ${toFa(info.week)} بارداری`}
									/>
									<span className="bgc__orb-badge">{`هفته ${toFa(activeWeek)}`}</span>
								</div>
							</div>
						</div>

						<div className="bgc__message">
							<span className="bgc__message-icon">
								<Icon name="message" size={18} />
							</span>
							<div className="bgc__message-body">
								<h4 className="bgc__message-title">پیام کوچولو</h4>
								<p className="bgc__message-text">{info.babyMessage}</p>
							</div>
						</div>

						<div className="bgc__nav">
							<span className="bgc__nav-title">{`هفته ${toFa(activeWeek)} از ${toFa(MAX_PREGNANCY_WEEK)}`}</span>
							<div className="bgc__nav-actions">
								<Button
									variant="outline"
									size="sm"
									onClick={() => goTo(activeWeek - 1)}
									disabled={activeWeek <= MIN_PREGNANCY_WEEK}
								>
									هفته قبل
								</Button>
								{currentWeek !== null && (
									<Button
										variant="secondary"
										size="sm"
										onClick={() => setSelectedWeek(null)}
										disabled={activeWeek === currentWeek}
									>
										هفته فعلی
									</Button>
								)}
								<Button
									variant="outline"
									size="sm"
									onClick={() => goTo(activeWeek + 1)}
									disabled={activeWeek >= MAX_PREGNANCY_WEEK}
								>
									هفته بعد
								</Button>
							</div>
						</div>

						<ol className="bgc__timeline">
							{timeline.map((point) => (
								<li key={point.week} className="bgc__timeline-item">
									<button
										type="button"
										className={`bgc__week${point.isActive ? " bgc__week--active" : ""}${
											point.isPast ? " bgc__week--past" : ""
										}`}
										aria-current={point.isActive ? "true" : undefined}
										onClick={() => goTo(point.week)}
									>
										<span className="bgc__week-dot" aria-hidden="true" />
										<span className="bgc__week-label">{`هفته ${toFa(point.week)}`}</span>
										{point.isCurrent && <span className="bgc__week-tag">هفته فعلی</span>}
									</button>
								</li>
							))}
						</ol>

						<p className="bgc__disclaimer">
							اندازه و وزن‌ها تقریبی و میانگین هستند و «پیام کوچولو» متنی احساسی و نوشته‌شده برای مادر است، نه
							پیام واقعی نوزاد. برای بررسی وضعیت خود با ماما یا پزشک مشورت کنید.
						</p>
					</>
				)}
			</div>
		</Card>
	)
}
