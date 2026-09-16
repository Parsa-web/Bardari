import { Link } from "react-router-dom"
import { Badge, Card, EmptyState, Grid, PageHeader, Stat } from "../../shared/components/ui"
import { useProviderSession } from "./useProviderSession"
import {
	checkupViewStatus,
	getMothersOfMidwife,
	getQuestions,
	getReferrals,
	getUpcomingCheckups,
	isOpenQuestion,
	motherFullName,
	getMother,
	subjectLabel,
} from "../../services/selectors"
import {
	CHECKUP_STATUS_LABELS,
	CHECKUP_STATUS_TONES,
	QUESTION_STATUS_LABELS,
	QUESTION_STATUS_TONES,
	REFERRAL_STATUS_LABELS,
	REFERRAL_STATUS_TONES,
} from "../../shared/constants/labels"
import { formatDateTime, toFa } from "../../shared/utils/date"

export function MidwifeDashboard() {
	const { db, providerId, displayName } = useProviderSession()
	const mothers = getMothersOfMidwife(db, providerId)
	const motherIds = mothers.map((mother) => mother.id)
	const questions = getQuestions(db, { midwifeId: providerId })
	const openQuestions = questions.filter(isOpenQuestion)
	const checkups = getUpcomingCheckups(db, motherIds)
	const referrals = getReferrals(db, { midwifeId: providerId })

	return (
		<>
			<PageHeader title={`میز کار ماما — ${displayName}`} subtitle="اولویت‌های امروز مراقبت" />

			<Grid cols={4}>
				<Stat label="مادران تحت مراقبت" value={toFa(mothers.length)} />
				<Stat
					label="سؤال باز"
					value={toFa(openQuestions.length)}
					tone={openQuestions.length ? "warn" : "success"}
				/>
				<Stat
					label="چکاپ نزدیک/عقب‌افتاده"
					value={toFa(checkups.length)}
					tone={checkups.length ? "warn" : "neutral"}
				/>
				<Stat label="ارجاعات ثبت‌شده" value={toFa(referrals.length)} />
			</Grid>

			<Grid cols={2}>
				<Card title="سؤال‌های نیازمند پاسخ" actions={<Link className="btn btn--ghost" to="/midwife/questions">مدیریت سؤال‌ها</Link>}>
					{openQuestions.length === 0 ? (
						<EmptyState title="سؤال بازی وجود ندارد." />
					) : (
						<ul className="list">
							{openQuestions.slice(0, 5).map((question) => (
								<li key={question.id} className="list__item">
									<div>
										<strong>{question.title}</strong>
										<p className="muted">
											{motherFullName(getMother(db, question.motherId))} · {subjectLabel(db, question.subject)}
										</p>
									</div>
									<Badge tone={QUESTION_STATUS_TONES[question.status]}>
										{QUESTION_STATUS_LABELS[question.status]}
									</Badge>
								</li>
							))}
						</ul>
					)}
				</Card>

				<Card title="چکاپ‌های در اولویت" actions={<Link className="btn btn--ghost" to="/midwife/checkups">همه چکاپ‌ها</Link>}>
					{checkups.length === 0 ? (
						<EmptyState title="چکاپ عقب‌افتاده یا نزدیک موعدی وجود ندارد." />
					) : (
						<ul className="list">
							{checkups.slice(0, 5).map((checkup) => {
								const view = checkupViewStatus(checkup)
								return (
									<li key={checkup.id} className="list__item">
										<div>
											<strong>{checkup.title}</strong>
											<p className="muted">
												{motherFullName(getMother(db, checkup.motherId))} · {formatDateTime(checkup.date, checkup.time)}
											</p>
										</div>
										<Badge tone={CHECKUP_STATUS_TONES[view]}>{CHECKUP_STATUS_LABELS[view]}</Badge>
									</li>
								)
							})}
						</ul>
					)}
				</Card>
			</Grid>

			<Card title="آخرین ارجاعات" actions={<Link className="btn btn--ghost" to="/midwife/referrals">مدیریت ارجاعات</Link>}>
				{referrals.length === 0 ? (
					<EmptyState title="ارجاعی ثبت نشده است." />
				) : (
					<ul className="list">
						{referrals.slice(0, 5).map((referral) => (
							<li key={referral.id} className="list__item">
								<div>
									<strong>{referral.reason}</strong>
									<p className="muted">{motherFullName(getMother(db, referral.motherId))}</p>
								</div>
								<Badge tone={REFERRAL_STATUS_TONES[referral.status]}>
									{REFERRAL_STATUS_LABELS[referral.status]}
								</Badge>
							</li>
						))}
					</ul>
				)}
			</Card>
		</>
	)
}
