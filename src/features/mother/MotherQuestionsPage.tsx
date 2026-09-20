import { useMemo, useState } from "react"
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
	Select,
	TextArea,
	TextInput,
} from "../../shared/components/ui"
import { decodeSubject, useMotherContext } from "./useMotherContext"
import { getQuestions, subjectLabel } from "../../services/selectors"
import { addQuestionMessage, createQuestion } from "../../services/mutations"
import {
	questionPriority,
	QUESTION_PRIORITY_ORDER,
	sortQuestionsByPriority,
} from "../../services/questionPriority"
import {
	QUESTION_PRIORITY_HINTS,
	QUESTION_PRIORITY_LABELS,
	QUESTION_PRIORITY_TONES,
	QUESTION_STATUS_LABELS,
	QUESTION_STATUS_TONES,
	ROLE_LABELS,
} from "../../shared/constants/labels"
import type { QuestionPriority } from "../../shared/types/domain"
import { formatTimestamp, toFa } from "../../shared/utils/date"

export function MotherQuestionsPage() {
	const { db, mother, motherId, displayName, subjectOptions } = useMotherContext()
	const { mutate } = useData()
	const questions = getQuestions(db, { motherId })
	const [error, setError] = useState<string | null>(null)
	const [search, setSearch] = useState("")
	const [statusFilter, setStatusFilter] = useState<string>("open")
	const [sort, setSort] = useState<string>("priority")
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})
	const [form, setForm] = useState({
		subjectValue: subjectOptions[1]?.value ?? subjectOptions[0]?.value ?? "",
		title: "",
		text: "",
		priority: "normal" as QuestionPriority,
	})
	const [replies, setReplies] = useState<Record<string, string>>({})

	type QuestionItem = (typeof questions)[number]

	const lastActivity = (question: QuestionItem) =>
		question.messages[question.messages.length - 1]?.createdAt ?? ""

	const visible = useMemo(() => {
		const term = search.trim().toLowerCase()
		const list = questions.filter((question) => {
			if (statusFilter === "open" && question.status === "closed") return false
			if (statusFilter !== "open" && statusFilter !== "all" && question.status !== statusFilter) {
				return false
			}
			if (!term) return true
			const haystack = [
				question.title,
				subjectLabel(db, question.subject),
				...question.messages.map((message) => message.text),
			]
				.join(" ")
				.toLowerCase()
			return haystack.includes(term)
		})
		const recentFirst = (a: QuestionItem, b: QuestionItem) =>
			lastActivity(a) < lastActivity(b) ? 1 : -1
		if (sort === "priority") return sortQuestionsByPriority(list, recentFirst)
		return [...list].sort((a, b) => {
			if (sort === "oldest") return lastActivity(a) < lastActivity(b) ? -1 : 1
			if (sort === "title") return a.title.localeCompare(b.title, "fa")
			return recentFirst(a, b)
		})
	}, [questions, db, search, statusFilter, sort])

	const openCount = questions.filter((question) => question.status !== "closed").length

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
				priority: form.priority,
			}),
		).then(() => setForm({ ...form, title: "", text: "", priority: "normal" }))
	}

	return (
		<>
			<PageHeader
				title="سؤال از ماما"
				subtitle="هر سؤال یک گفتگوی مستقل است؛ اولویت را درست انتخاب کنید تا سریع‌تر دیده شود"
			/>

			{error && <Alert tone="danger">{error}</Alert>}

			<Card title="ثبت سؤال جدید">
				<FormRow>
					<Field label="موضوع">
						<Select
							value={form.subjectValue}
							onChange={(value) => setForm({ ...form, subjectValue: value })}
							options={subjectOptions.map((option) => ({ value: option.value, label: option.label }))}
						/>
					</Field>
					<Field label="اولویت" hint={QUESTION_PRIORITY_HINTS[form.priority]}>
						<Select
							value={form.priority}
							onChange={(value) => setForm({ ...form, priority: value as QuestionPriority })}
							options={QUESTION_PRIORITY_ORDER.map((priority) => ({
								value: priority,
								label: QUESTION_PRIORITY_LABELS[priority],
							}))}
						/>
					</Field>
				</FormRow>
				<Field label="عنوان سؤال">
					<TextInput value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
				</Field>
				<Field label="متن سؤال">
					<TextArea value={form.text} onChange={(value) => setForm({ ...form, text: value })} />
				</Field>
				<Button variant="primary" icon="plus" onClick={submit}>
					ارسال سؤال
				</Button>
			</Card>

			<Card
				title="سؤال‌های من"
				subtitle={`${toFa(openCount)} سؤال باز از مجموع ${toFa(questions.length)} سؤال`}
			>
				<div className="filterbar">
					<Field label="جستجو">
						<TextInput
							value={search}
							placeholder="جستجو در عنوان و متن گفتگو"
							onChange={(value) => setSearch(value)}
						/>
					</Field>
					<Field label="وضعیت">
						<Select
							value={statusFilter}
							onChange={setStatusFilter}
							options={[
								{ value: "open", label: "فقط سؤال‌های باز" },
								{ value: "all", label: "همه سؤال‌ها" },
								...Object.entries(QUESTION_STATUS_LABELS).map(([value, label]) => ({
									value,
									label: String(label),
								})),
							]}
						/>
					</Field>
					<Field label="مرتب‌سازی">
						<Select
							value={sort}
							onChange={setSort}
							options={[
								{ value: "priority", label: "اولویت (فوری ← عادی)" },
								{ value: "recent", label: "تازه‌ترین گفتگو" },
								{ value: "oldest", label: "قدیمی‌ترین گفتگو" },
								{ value: "title", label: "عنوان (الفبا)" },
							]}
						/>
					</Field>
				</div>

				<p className="result-count">{toFa(visible.length)} سؤال نمایش داده می‌شود</p>

				{visible.length === 0 ? (
					<EmptyState
						title="سؤالی با این فیلتر پیدا نشد."
						hint="می‌توانید وضعیت را روی «همه سؤال‌ها» بگذارید یا عبارت دیگری جستجو کنید."
					/>
				) : (
					<div className="qlist">
						{visible.map((question, index) => {
							const isOpen = expanded[question.id] ?? (index === 0 && question.status !== "closed")
							const last = question.messages[question.messages.length - 1]
							const priority = questionPriority(question)
							return (
								<details
									key={question.id}
									className="qitem"
									open={isOpen}
									onToggle={(event) =>
										setExpanded((current) => ({
											...current,
											[question.id]: (event.currentTarget as HTMLDetailsElement).open,
										}))
									}
								>
									<summary className="qitem__summary">
										<span className="qitem__main">
											<span className="qitem__title">{question.title}</span>
											<span className="qitem__meta">
												{subjectLabel(db, question.subject)} · {toFa(question.messages.length)} پیام
												{last ? ` · آخرین پیام: ${formatTimestamp(last.createdAt)}` : ""}
											</span>
										</span>
										<span className="qitem__side">
											<Badge tone={QUESTION_PRIORITY_TONES[priority]}>
												{QUESTION_PRIORITY_LABELS[priority]}
											</Badge>
											<Badge tone={QUESTION_STATUS_TONES[question.status]}>
												{QUESTION_STATUS_LABELS[question.status]}
											</Badge>
										</span>
									</summary>

									<div className="qitem__body">
										<ul className="thread">
											{question.messages.map((message) => (
												<li
													key={message.id}
													className={`thread__item thread__item--${message.authorRole}`}
												>
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
													<TextArea
														value={replies[question.id] ?? ""}
														onChange={(value) =>
															setReplies((current) => ({ ...current, [question.id]: value }))
														}
													/>
												</Field>
												<Button
													variant="primary"
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
														).then(() =>
															setReplies((current) => ({ ...current, [question.id]: "" })),
														)
													}}
												>
													ارسال پیام
												</Button>
											</>
										)}
									</div>
								</details>
							)
						})}
					</div>
				)}
			</Card>
		</>
	)
}
