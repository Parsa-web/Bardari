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
	PageHeader,
} from "../../shared/components/ui"
import { decodeSubject, useMotherContext } from "./useMotherContext"
import { getQuestions, subjectLabel } from "../../services/selectors"
import { addQuestionMessage, createQuestion } from "../../services/mutations"
import { QUESTION_STATUS_LABELS, QUESTION_STATUS_TONES, ROLE_LABELS } from "../../shared/constants/labels"
import { formatTimestamp } from "../../shared/utils/date"

export function MotherQuestionsPage() {
	const { db, mother, motherId, displayName, subjectOptions } = useMotherContext()
	const { mutate } = useData()
	const questions = getQuestions(db, { motherId })
	const [error, setError] = useState<string | null>(null)
	const [form, setForm] = useState({
		subjectValue: subjectOptions[1]?.value ?? subjectOptions[0]?.value ?? "",
		title: "",
		text: "",
	})
	const [replies, setReplies] = useState<Record<string, string>>({})

	const submit = () => {
		if (!form.title.trim() || !form.text.trim()) {
			setError("عنوان و متن سؤال الزامی است.")
			return
		}
		setError(null)
		void mutate((current) =>
			createQuestion(current, {
				motherId,
				midwifeId: mother?.careTeam.midwifeId,
				subject: decodeSubject(form.subjectValue),
				title: form.title.trim(),
				text: form.text.trim(),
				authorName: displayName,
			}),
		).then(() => setForm({ ...form, title: "", text: "" }))
	}

	return (
		<>
			<PageHeader
				title="سؤال از ماما"
				subtitle="هر سؤال یک پرونده گفتگوی مستقل با وضعیت مشخص است"
			/>

			{error && <Alert tone="danger">{error}</Alert>}

			<Card title="ثبت سؤال جدید">
				<FormRow>
					<Field label="موضوع">
						<select
							className="input"
							value={form.subjectValue}
							onChange={(event) => setForm({ ...form, subjectValue: event.target.value })}
						>
							{subjectOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</Field>
					<Field label="عنوان سؤال">
						<input
							className="input"
							value={form.title}
							onChange={(event) => setForm({ ...form, title: event.target.value })}
						/>
					</Field>
				</FormRow>
				<Field label="متن سؤال">
					<textarea
						className="input input--area"
						value={form.text}
						onChange={(event) => setForm({ ...form, text: event.target.value })}
					/>
				</Field>
				<Button variant="primary" onClick={submit}>
					ارسال سؤال
				</Button>
			</Card>

			{questions.length === 0 ? (
				<Card>
					<EmptyState title="هنوز سؤالی ثبت نکرده‌اید." />
				</Card>
			) : (
				questions.map((question) => (
					<Card
						key={question.id}
						title={question.title}
						subtitle={subjectLabel(db, question.subject)}
						actions={
							<Badge tone={QUESTION_STATUS_TONES[question.status]}>
								{QUESTION_STATUS_LABELS[question.status]}
							</Badge>
						}
					>
						<ul className="thread">
							{question.messages.map((message) => (
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

						{question.status === "closed" ? (
							<Alert tone="neutral">این پرونده بسته شده است.</Alert>
						) : (
							<>
								<Field label="پیام جدید">
									<textarea
										className="input input--area"
										value={replies[question.id] ?? ""}
										onChange={(event) =>
											setReplies({ ...replies, [question.id]: event.target.value })
										}
									/>
								</Field>
								<Button
									disabled={!(replies[question.id] ?? "").trim()}
									onClick={() => {
										const text = (replies[question.id] ?? "").trim()
										if (!text) return
										void mutate((current) =>
											addQuestionMessage(
												current,
												question.id,
												{ authorRole: "mother", authorName: displayName, text },
												question.status === "answered" ? "needs_followup" : question.status,
											),
										).then(() => setReplies({ ...replies, [question.id]: "" }))
									}}
								>
									ارسال پیام
								</Button>
							</>
						)}
					</Card>
				))
			)}
		</>
	)
}
