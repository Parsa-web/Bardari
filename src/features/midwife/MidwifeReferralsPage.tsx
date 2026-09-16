import { Badge, Button, Card, EmptyState, PageHeader } from "../../shared/components/ui"
import { useData } from "../../app/providers/DataProvider"
import { useProviderSession } from "./useProviderSession"
import { getMother, getProviderName, getReferrals, motherFullName, subjectLabel } from "../../services/selectors"
import { setReferralStatus } from "../../services/mutations"
import {
	REFERRAL_STATUS_LABELS,
	REFERRAL_STATUS_TONES,
	URGENCY_LABELS,
	URGENCY_TONES,
} from "../../shared/constants/labels"
import { formatTimestamp } from "../../shared/utils/date"

export function MidwifeReferralsPage() {
	const { db, providerId, displayName } = useProviderSession()
	const { mutate } = useData()
	const referrals = getReferrals(db, { midwifeId: providerId })

	return (
		<>
			<PageHeader title="ارجاعات من" subtitle="پیگیری چرخه ارجاع تا ثبت اقدام متخصص" />

			{referrals.length === 0 ? (
				<Card>
					<EmptyState
						title="ارجاعی ثبت نشده است."
						hint="از بخش سؤال‌ها می‌توانید برای یک پرونده ارجاع بسازید."
					/>
				</Card>
			) : (
				referrals.map((referral) => (
					<Card
						key={referral.id}
						title={referral.reason}
						subtitle={`${motherFullName(getMother(db, referral.motherId))} · ${subjectLabel(db, referral.subject)} · متخصص: ${getProviderName(db, referral.specialistId)}`}
						actions={
							<div className="row-actions">
								<Badge tone={URGENCY_TONES[referral.urgency]}>{URGENCY_LABELS[referral.urgency]}</Badge>
								<Badge tone={REFERRAL_STATUS_TONES[referral.status]}>
									{REFERRAL_STATUS_LABELS[referral.status]}
								</Badge>
							</div>
						}
					>
						<p>{referral.summary}</p>

						{referral.actions.length > 0 && (
							<ul className="list">
								{referral.actions.map((action) => (
									<li key={action.id} className="list__item">
										<div>
											<strong>اقدام {action.authorName}</strong>
											<p className="muted">{formatTimestamp(action.createdAt)}</p>
											<p>{action.note}</p>
										</div>
									</li>
								))}
							</ul>
						)}

						<ol className="steps">
							{referral.history.map((event) => (
								<li key={event.id}>
									<strong>{REFERRAL_STATUS_LABELS[event.status]}</strong>
									<span className="muted">
										{formatTimestamp(event.at)} · {event.by}
									</span>
								</li>
							))}
						</ol>

						{referral.status !== "closed" && (
							<Button
								onClick={() => {
									void mutate((current) => setReferralStatus(current, referral.id, "closed", displayName))
								}}
							>
								بستن ارجاع
							</Button>
						)}
					</Card>
				))
			)}
		</>
	)
}
