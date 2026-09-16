import { useState } from "react"
import { useData } from "../../app/providers/DataProvider"
import {
	Alert,
	Badge,
	Button,
	Card,
	EmptyState,
	Field,
	FormRow,
	Modal,
	PageHeader,
	Toolbar,
} from "../../shared/components/ui"
import { useProviderSession } from "./useProviderSession"
import { getMother, getQuestions, motherFullName, subjectLabel } from "../../services/selectors"
import { addQuestionMessage, createReferral, setQuestionStatus } from "../../services/mutations"
import {
	QUESTION_STATUS_LABELS,
	QUESTION_STATUS_TONES,
	ROLE_LABELS,
	URGENCY_LABELS,
} from "../../shared/constants/labels"
import type { QuestionStatus, Urgency } from "../../shared/types/domain"
import { formatTimestamp } from "../../shared/utils/date"

const STATUS_ACTIONS: QuestionStatus[] = ["in_review", "answered", "needs_followup", "closed"]

export function MidwifeQuestionsPage() {
	const { db, providerId, displayName } = useProviderSession()
	const { mutate } = useData()
	const questions = getQuestions(db, { midwifeId: providerId })
	const specialists = db.providers.filter((provider) => provider.role === "specialist")
	const [replies, setReplies] = useState<Record<string, string>>({})
	const [referralFor, setReferralFor] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [referralForm, setReferralForm] = useState({
		specialistId: specialists[0]?.id ?? "",
		reason: "",
		summary: "",
		urgency: "normal" as Urgency,
	})

	const question = questions.find((item) => item.id === referralFor) ?? null

	const submitReferral = () => {
		if (!question) return
		if (!referralForm.specialistId || !referralForm.reason.trim() || !referralForm.summary.trim()) {
			setError("متخصص، دلیل و خلاصه ارجاع الزامی است.")
			return
		}
		setError(null)
		void mutate((current) =>
			createReferral(current, {
				motherId: question.motherId,
				midwifeId: providerId,
				specialistId: referralForm.specialistId,
				subject: question.subject ?? { kind: "mother", id: question.motherId },
				questionId: question.id,
				reason: referralForm.reason.trim(),
				summary: referralForm.summary.trim(),
				urgency: referralForm.urgency,
				createdByName: displayName,
			}),
		).then(() => {
			setReferralFor(null)
			setReferralForm({ ...referralForm, reason: "", summary: "" })
		})
	}

	return (
		<>
			<PageHeader title="سؤال‌های مادران" subtitle="پاسخ، تغییر وضعیت و ارجاع به متخصص" />

			{error && <Alert tone="danger">{error}</Alert>}

			{questions.length === 0 ? (
				<Card>
					<EmptyState title="سؤالی برای شما ثبت نشده است." />
				</Card>
			) : (
				questions.map((item) => (
					<Card
						key={item.id}
						title={item.title}
						subtitle={`${motherFullName(getMother(db, item.motherId))} · ${subjectLabel(db, item.subject)}`}
						actions={
							<Badge tone={QUESTION_STATUS_TONES[item.status]}>{QUESTION_STATUS_LABELS[item.status]}</Badge>
						}
					>
						<ul className="thread">
							{item.messages.map((message) => (
								<li key={message.id} className={`thread__item thread__item--${message.authorRole}`}>
									<div className="thread__meta">
										<strong>{message.authorName}</strong>
										<span className="muted">
											{ROLE_LABELS[message.authorRole]} · {formatTimestamp(message.createdAt)}
										</span>
									</div>
									<p>{message.text}</p>
								</li>
							))}
						</ul>

						<Field label="پاسخ شما">
							<textarea
								className="input input--area"
								value={replies[item.id] ?? ""}
								onChange={(event) => setReplies({ ...replies, [item.id]: event.target.value })}
							/>
						</Field>
						<Toolbar>
							<Button
								variant="primary"
								disabled={!(replies[item.id] ?? "").trim()}
								onClick={() => {
									const text = (replies[item.id] ?? "").trim()
									if (!text) return
									void mutate((current) =>
										addQuestionMessage(
											current,
											item.id,
											{ authorRole: "midwife", authorName: displayName, text },
											"answered",
										),
									).then(() => setReplies({ ...replies, [item.id]: "" }))
								}}
							>
								ارسال پاسخ
							</Button>
							{STATUS_ACTIONS.filter((status) => status !== item.status).map((status) => (
								<Button
									key={status}
									variant="ghost"
									onClick={() => {
										void mutate((current) => setQuestionStatus(current, item.id, status))
									}}
								>
									{QUESTION_STATUS_LABELS[status]}
								</Button>
							))}
							<Button
								onClick={() => {
									setReferralFor(item.id)
									setReferralForm({ ...referralForm, reason: item.title })
								}}
							>
								ارجاع به متخصص
							</Button>
						</Toolbar>
					</Card>
				))
			)}

			<Modal open={referralFor !== null} title="ایجاد ارجاع" onClose={() => setReferralFor(null)}>
				{specialists.length === 0 ? (
					<Alert tone="warn">متخصصی در سامانه ثبت نشده است.</Alert>
				) : (
					<>
						<FormRow>
							<Field label="متخصص">
								<select
									className="input"
									value={referralForm.specialistId}
									onChange={(event) => setReferralForm({ ...referralForm, specialistId: event.target.value })}
								>
									{specialists.map((specialist) => (
										<option key={specialist.id} value={specialist.id}>
											{specialist.name}
											{specialist.specialty ? ` — ${specialist.specialty}` : ""}
										</option>
									))}
								</select>
							</Field>
							<Field label="فوریت">
								<select
									className="input"
									value={referralForm.urgency}
									onChange={(event) =>
										setReferralForm({ ...referralForm, urgency: event.target.value as Urgency })
									}
								>
									<option value="low">{URGENCY_LABELS.low}</option>
									<option value="normal">{URGENCY_LABELS.normal}</option>
									<option value="high">{URGENCY_LABELS.high}</option>
								</select>
							</Field>
						</FormRow>
						<Field label="دلیل ارجاع">
							<input
								className="input"
								value={referralForm.reason}
								onChange={(event) => setReferralForm({ ...referralForm, reason: event.target.value })}
							/>
						</Field>
						<Field label="خلاصه پرونده برای متخصص">
							<textarea
								className="input input--area"
								value={referralForm.summary}
								onChange={(event) => setReferralForm({ ...referralForm, summary: event.target.value })}
							/>
						</Field>
						<Button variant="primary" onClick={submitReferral}>
							ثبت و ارسال ارجاع
						</Button>
					</>
				)}
			</Modal>
		</>
	)
}
