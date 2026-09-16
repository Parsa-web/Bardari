import { Link } from "react-router-dom"
import { Badge, Card, EmptyState, Grid, PageHeader, Stat } from "../../shared/components/ui"
import { useProviderSession } from "../midwife/useProviderSession"
import { getMother, getReferrals, motherFullName } from "../../services/selectors"
import {
	REFERRAL_STATUS_LABELS,
	REFERRAL_STATUS_TONES,
	URGENCY_LABELS,
	URGENCY_TONES,
} from "../../shared/constants/labels"
import { formatTimestamp, toFa } from "../../shared/utils/date"

/** میز کار متخصص فقط بر صف ارجاعات متمرکز است؛ نه نسخه بزرگ‌تر داشبورد ماما. */
export function SpecialistDashboard() {
	const { db, providerId, displayName } = useProviderSession()
	const referrals = getReferrals(db, { specialistId: providerId })
	const incoming = referrals.filter((referral) => referral.status === "sent")
	const inReview = referrals.filter(
		(referral) => referral.status === "seen" || referral.status === "in_review",
	)
	const urgent = referrals.filter(
		(referral) => referral.urgency === "high" && referral.status !== "closed",
	)

	return (
		<>
			<PageHeader title={`میز کار متخصص — ${displayName}`} subtitle="صف ارجاعات دریافتی" />

			<Grid cols={4}>
				<Stat label="ارجاع جدید" value={toFa(incoming.length)} tone={incoming.length ? "warn" : "neutral"} />
				<Stat label="در حال بررسی" value={toFa(inReview.length)} tone="info" />
				<Stat label="فوریت بالا" value={toFa(urgent.length)} tone={urgent.length ? "danger" : "success"} />
				<Stat label="مجموع ارجاعات" value={toFa(referrals.length)} />
			</Grid>

			<Card
				title="ارجاعات در اولویت"
				actions={
					<Link className="btn btn--ghost" to="/specialist/referrals">
						مدیریت صف ارجاعات
					</Link>
				}
			>
				{referrals.length === 0 ? (
					<EmptyState title="ارجاعی برای شما ارسال نشده است." />
				) : (
					<ul className="list">
						{[...incoming, ...inReview].slice(0, 6).map((referral) => (
							<li key={referral.id} className="list__item">
								<div>
									<strong>{referral.reason}</strong>
									<p className="muted">
										{motherFullName(getMother(db, referral.motherId))} · {formatTimestamp(referral.createdAt)}
									</p>
								</div>
								<div className="row-actions">
									<Badge tone={URGENCY_TONES[referral.urgency]}>{URGENCY_LABELS[referral.urgency]}</Badge>
									<Badge tone={REFERRAL_STATUS_TONES[referral.status]}>
										{REFERRAL_STATUS_LABELS[referral.status]}
									</Badge>
								</div>
							</li>
						))}
					</ul>
				)}
			</Card>
		</>
	)
}
