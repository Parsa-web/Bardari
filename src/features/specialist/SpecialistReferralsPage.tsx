import { useState } from "react"
import { useData } from "../../app/providers/DataProvider"
import {
	Alert,
	Badge,
	Button,
	Card,
	EmptyState,
	Field,
	PageHeader,
	Toolbar,
} from "../../shared/components/ui"
import { useProviderSession } from "../midwife/useProviderSession"
import {
	getChildren,
	getMother,
	getPregnancies,
	getProviderName,
	getReferrals,
	motherFullName,
	subjectLabel,
} from "../../services/selectors"
import { addReferralAction, setReferralStatus } from "../../services/mutations"
import {
	NOT_RECORDED,
	REFERRAL_STATUS_LABELS,
	REFERRAL_STATUS_TONES,
	URGENCY_LABELS,
	URGENCY_TONES,
} from "../../shared/constants/labels"
import { formatAge, formatGestation, formatTimestamp, gestation } from "../../shared/utils/date"

export function SpecialistReferralsPage() {
	const { db, providerId, displayName } = useProviderSession()
	const { mutate } = useData()
	const referrals = getReferrals(db, { specialistId: providerId })
	const [notes, setNotes] = useState<Record<string, string>>({})

	return (
		<>
			<PageHeader
				title="صف ارجاعات"
				subtitle="مشاهده ← در حال بررسی ← ثبت اقدام ← بستن ارجاع"
			/>

			{referrals.length === 0 ? (
				<Card>
					<EmptyState title="ارجاعی در صف شما نیست." />
				</Card>
			) : (
				referrals.map((referral) => {
					const mother = getMother(db, referral.motherId)
					const pregnancies = getPregnancies(db, referral.motherId)
					const active = pregnancies.find((pregnancy) => pregnancy.status === "active")
					const children = getChildren(db, referral.motherId)
					const note = notes[referral.id] ?? ""
					return (
						<Card
							key={referral.id}
							title={referral.reason}
							subtitle={`${motherFullName(mother)} · ${subjectLabel(db, referral.subject)} · ارجاع‌دهنده: ${getProviderName(db, referral.midwifeId)}`}
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

							<dl className="pairs">
								<div>
									<dt>وضعیت بارداری</dt>
									<dd>
										{active
											? formatGestation(gestation({ lmpDate: active.lmpDate, eddDate: active.eddDate }))
											: NOT_RECORDED}
									</dd>
								</div>
								<div>
									<dt>کودکان</dt>
									<dd>
										{children.length === 0
											? NOT_RECORDED
											: children.map((child) => `${child.name} (${formatAge(child.birthDate)})`).join("، ")}
									</dd>
								</div>
								<div>
									<dt>تاریخ ارجاع</dt>
									<dd>{formatTimestamp(referral.createdAt)}</dd>
								</div>
							</dl>

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

							{referral.actions.length > 0 && (
								<ul className="list">
									{referral.actions.map((action) => (
										<li key={action.id} className="list__item">
											<div>
												<strong>{action.authorName}</strong>
												<p className="muted">{formatTimestamp(action.createdAt)}</p>
												<p>{action.note}</p>
											</div>
										</li>
									))}
								</ul>
							)}

							{referral.status === "closed" ? (
								<Alert tone="neutral">این ارجاع بسته شده است.</Alert>
							) : (
								<>
									<Field label="ثبت اقدام تخصصی">
										<textarea
											className="input input--area"
											value={note}
											onChange={(event) => setNotes({ ...notes, [referral.id]: event.target.value })}
										/>
									</Field>
									<Toolbar>
										{referral.status === "sent" && (
											<Button
												onClick={() => {
													void mutate((current) =>
														setReferralStatus(current, referral.id, "seen", displayName),
													)
												}}
											>
												ثبت مشاهده
											</Button>
										)}
										{referral.status !== "in_review" && referral.status !== "action_logged" && (
											<Button
												onClick={() => {
													void mutate((current) =>
														setReferralStatus(current, referral.id, "in_review", displayName),
													)
												}}
											>
												در حال بررسی
											</Button>
										)}
										<Button
											variant="primary"
											disabled={!note.trim()}
											onClick={() => {
												if (!note.trim()) return
												void mutate((current) =>
													addReferralAction(current, referral.id, {
														authorName: displayName,
														note: note.trim(),
													}),
												).then(() => setNotes({ ...notes, [referral.id]: "" }))
											}}
										>
											ثبت اقدام
										</Button>
										<Button
											onClick={() => {
												void mutate((current) =>
													setReferralStatus(current, referral.id, "closed", displayName),
												)
											}}
										>
											بستن ارجاع
										</Button>
									</Toolbar>
								</>
							)}
						</Card>
					)
				})
			)}
		</>
	)
}
