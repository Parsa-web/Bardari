import { Link } from "react-router-dom"
import { Badge, Card, EmptyState, Grid, PageHeader, Stat } from "../../shared/components/ui"
import { BabyGrowthCard } from "../../components/BabyGrowthCard/BabyGrowthCard"
import { PregnancyGrowthChart } from "../../components/GrowthChart/PregnancyGrowthChart"
import { CareSummary } from "../care/CareSummary"
import { useMotherContext } from "./useMotherContext"
import {
	checkupViewStatus,
	getActivePregnancy,
	getChildren,
	getCheckups,
	getQuestions,
	getTodayActivities,
	isOpenQuestion,
	subjectLabel,
} from "../../services/selectors"
import {
	ACTIVITY_CATEGORY_LABELS,
	CHECKUP_STATUS_LABELS,
	CHECKUP_STATUS_TONES,
	NOT_RECORDED,
	QUESTION_STATUS_LABELS,
	QUESTION_STATUS_TONES,
} from "../../shared/constants/labels"
import {
	formatDate,
	formatDateTime,
	formatGestation,
	formatTime,
	gestation,
	toFa,
} from "../../shared/utils/date"

export function MotherDashboard() {
	const { db, motherId, displayName } = useMotherContext()
	const pregnancy = getActivePregnancy(db, motherId)
	const children = getChildren(db, motherId)
	const todayActivities = getTodayActivities(db, motherId)
	const openQuestions = getQuestions(db, { motherId }).filter(isOpenQuestion)
	const nextCheckups = getCheckups(db, motherId)
		.filter((checkup) => {
			const view = checkupViewStatus(checkup)
			return view === "pending" || view === "due_soon" || view === "overdue"
		})
		.slice(0, 4)

	const gest = pregnancy ? gestation({ lmpDate: pregnancy.lmpDate, eddDate: pregnancy.eddDate }) : null

	return (
		<>
			<PageHeader title={`خوش آمدید، ${displayName}`} subtitle="خلاصه وضعیت مراقبت شما" />

			<Grid cols={4}>
				<Stat
					label="بارداری فعال"
					value={pregnancy ? formatGestation(gest) : "بارداری فعالی ثبت نشده"}
					hint={
						pregnancy
							? gest
								? `تاریخ تخمینی زایمان: ${formatDate(gest.eddDate)}`
								: NOT_RECORDED
							: "در بخش بارداری‌ها می‌توانید پرونده جدید ثبت کنید."
					}
					tone={pregnancy ? "info" : "neutral"}
				/>
				<Stat label="فعالیت امروز" value={toFa(todayActivities.length)} hint="مورد ثبت‌شده" />
				<Stat label="سؤال‌های در جریان" value={toFa(openQuestions.length)} tone={openQuestions.length ? "warn" : "neutral"} />
				<Stat label="تعداد کودکان" value={toFa(children.length)} />
			</Grid>

			{gest && <BabyGrowthCard week={gest.weeks} />}

			{gest && <PregnancyGrowthChart week={gest.weeks} />}

			<CareSummary />

			<Grid cols={2}>
				<Card title="چکاپ‌های در پیش" actions={<Link className="btn btn--ghost" to="/mother/checkups">همه چکاپ‌ها</Link>}>
					{nextCheckups.length === 0 ? (
						<EmptyState title="چکاپ پیش‌رویی ثبت نشده است." />
					) : (
						<ul className="list">
							{nextCheckups.map((checkup) => {
								const view = checkupViewStatus(checkup)
								return (
									<li key={checkup.id} className="list__item">
										<div>
											<strong>{checkup.title}</strong>
											<p className="muted">
												{formatDateTime(checkup.date, checkup.time)} · {subjectLabel(db, checkup.subject)}
											</p>
										</div>
										<Badge tone={CHECKUP_STATUS_TONES[view]}>{CHECKUP_STATUS_LABELS[view]}</Badge>
									</li>
								)
							})}
						</ul>
					)}
				</Card>

				<Card title="فعالیت‌های امروز" actions={<Link className="btn btn--ghost" to="/mother/activities">ثبت فعالیت</Link>}>
					{todayActivities.length === 0 ? (
						<EmptyState title="برای امروز فعالیتی ثبت نشده است." hint="می‌توانید خواب، تغذیه، ورزش یا سایر را ثبت کنید." />
					) : (
						<ul className="list">
							{todayActivities.map((activity) => (
								<li key={activity.id} className="list__item">
									<div>
										<strong>{activity.title}</strong>
										<p className="muted">
											ساعت {formatTime(activity.time)} · {ACTIVITY_CATEGORY_LABELS[activity.category]}
										</p>
									</div>
									<Badge tone="info">{subjectLabel(db, activity.subject)}</Badge>
								</li>
							))}
						</ul>
					)}
				</Card>
			</Grid>

			<Card title="سؤال‌های من" actions={<Link className="btn btn--ghost" to="/mother/questions">مشاهده</Link>}>
				{openQuestions.length === 0 ? (
					<EmptyState title="سؤال در جریانی ندارید." />
				) : (
					<ul className="list">
						{openQuestions.slice(0, 4).map((question) => (
							<li key={question.id} className="list__item">
								<div>
									<strong>{question.title}</strong>
									<p className="muted">{subjectLabel(db, question.subject)}</p>
								</div>
								<Badge tone={QUESTION_STATUS_TONES[question.status]}>
									{QUESTION_STATUS_LABELS[question.status]}
								</Badge>
							</li>
						))}
					</ul>
				)}
			</Card>
		</>
	)
}
