import { useState } from "react"
import { Button, Card, EmptyState } from "../../shared/components/ui"
import {
	clampPregnancyWeek,
	getPregnancyWeek,
	MAX_PREGNANCY_WEEK,
	MIN_PREGNANCY_WEEK,
} from "../../data/pregnancyWeeks"
import { toFa } from "../../shared/utils/date"
import "./BabyGrowthCard.css"

/**
 * کارت «رشد هفتگی نوزاد».
 * داده‌ها از src/data/pregnancyWeeks.ts خوانده می‌شود و هیچ داده‌ای درون کامپوننت hardcode نیست.
 *
 * نمونه استفاده: <BabyGrowthCard week={9} />
 */
export function BabyGrowthCard({ week }: { week?: number | null }) {
	const currentWeek = typeof week === "number" ? clampPregnancyWeek(week) : null
	const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
	const activeWeek = selectedWeek ?? currentWeek ?? MIN_PREGNANCY_WEEK
	const info = getPregnancyWeek(activeWeek)

	const goTo = (value: number) => setSelectedWeek(clampPregnancyWeek(value))

	return (
		<Card
			title={`هفته ${toFa(activeWeek)} بارداری`}
			subtitle="رشد هفتگی نوزاد — اطلاعات آموزشی و تقریبی"
			actions={
				currentWeek !== null && activeWeek !== currentWeek ? (
					<Button variant="ghost" size="sm" onClick={() => setSelectedWeek(null)}>
						{`بازگشت به هفته فعلی (${toFa(currentWeek)})`}
					</Button>
				) : undefined
			}
		>
			<div className="bgc">
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

				{!info ? (
					<EmptyState
						title="اطلاعات این هفته ثبت نشده است."
						hint="اطلاعات هفته‌های ۱ تا ۴۰ بارداری در دسترس است."
					/>
				) : (
					<>
						{info.image ? (
							<img
								className="bgc__image"
								src={info.image}
								alt={`تصویر رشد نوزاد در هفته ${toFa(info.week)} بارداری`}
								loading="lazy"
							/>
						) : (
							<div className="bgc__placeholder" role="img" aria-label="تصویر این هفته هنوز اضافه نشده است">
								<span className="bgc__placeholder-icon" aria-hidden="true">
									🖼️
								</span>
								<p className="bgc__placeholder-text">تصویر این هفته به‌زودی اضافه می‌شود</p>
							</div>
						)}

						<div className="bgc__facts">
							<div className="bgc__fact">
								<span className="bgc__fact-label">اندازه</span>
								<span className="bgc__fact-value">{info.size}</span>
							</div>
							<div className="bgc__fact">
								<span className="bgc__fact-label">وزن</span>
								<span className="bgc__fact-value">{info.weight}</span>
							</div>
						</div>

						<div className="bgc__block">
							<h3 className="bgc__block-title">رشد این هفته</h3>
							<p className="bgc__block-text">{info.development}</p>
						</div>

						<div className="bgc__block bgc__message">
							<h3 className="bgc__block-title">💌 پیام کوچولو</h3>
							<p className="bgc__block-text">{info.babyMessage}</p>
						</div>

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
