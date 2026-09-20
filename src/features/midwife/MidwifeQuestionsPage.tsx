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
	Modal,
	PageHeader,
	Select,
	TextArea,
	TextInput,
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
import { formatTimestamp, toFa } from "../../shared/utils/date"

const STATUS_ACTIONS: QuestionStatus[] = ["in_review", "answered", "needs_followup", "closed"]

export function MidwifeQuestionsPage() {
	const { db, providerId, displayName } = useProviderSession()
	const { mutate } = useData()
	const questions = getQuestions(db, { midwifeId: providerId })
	const specialists = db.providers.filter((provider) => provider.role === "specialist")
	const [replies, setReplies] = useState<Record<string, string>>({})
	const [referralFor, setReferralFor] = useState<string | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [search, setSearch] = useState("")
	const [statusFilter, setStatusFilter] = useState<string>("open")
	const [sort, setSort] = useState<string>("recent")
	const [expanded, setExpanded] = useState<Record<string, boolean>>({})
	const [referralForm, setReferralForm] = useState({
		specialistId: specialists[0]?.id ?? "",
		reason: "",
		summary: "",
		urgency: "normal" as Urgency,
	})

	const question = questions.find((item) => item.id === referralFor) ?? null

	type QuestionItem = (typeof questions)[number]

	const lastActivity = (item: QuestionItem) =>
		item.messages[item.messages.length - 1]?.createdAt ?? ""

	const visible = useMemo(() => {
		const term = search.trim().toLowerCase()
		const list = questions.filter((item) => {
			if (statusFilter === "open" && item.status === "closed") return false
			if (statusFilter !== "open" && statusFilter !== "all" && item.status !== statusFilter) {
				return false
			}
			if (!term) return true
			const haystack = [
				item.title,
				motherFullName(getMother(db, item.motherId)),
				subjectLabel(db, item.subject),
				...item.messages.map((message) => message.text),
			]
				.join(" ")
				.toLowerCase()
			return haystack.includes(term)
		})
		return [...list].sort((a, b) => {
			if (sort === "oldest") return lastActivity(a) < lastActivity(b) ? -1 : 1
			if (sort === "mother") {
				return motherFullName(getMother(db, a.motherId)).localeCompare(
					motherFullName(getMother(db, b.motherId)),
					"fa",
				)
			}
			return lastActivity(a) < lastActivity(b) ? 1 : -1
		})
	}, [questions, db, search, statusFilter, sort])

	const openCount = questions.filter((item) => item.status !== "closed").length

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

			<Card
				title="صندوق سؤال‌ها"
				subtitle={`${toFa(openCount)} سؤال باز از مجموع ${toFa(questions.length)} سؤال`}
			>
				<div className="filterbar">
					<Field label="جستجو">
						<TextInput
							value={search}
							placeholder="نام مادر، عنوان یا متن پیام"
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
								{ value: "recent", label: "تازه‌ترین گفتگو" },
								{ value: "oldest", label: "قدیمی‌ترین گفتگو" },
								{ value: "mother", label: "نام مادر" },
							]}
						/>
					</Field>
				</div>

				<p className="result-count">{toFa(visible.length)} سؤال نمایش داده می‌شود</p>

				{visible.length === 0 ? (
					<EmptyState
						title="سؤالی با این فیلتر یافت نشد."
						hint="وضعیت را روی «همه سؤال‌ها» بگذارید یا عبارت دیگری جستجو کنید."
					/>
				) : (
					<div className="qlist">
						{visible.map((item, index) => {
							const isOpen = expanded[item.id] ?? (index === 0 && item.status !== "closed")
							const last = item.messages[item.messages.length - 1]
							return (
								<details
									key={item.id}
									className="qitem"
									open={isOpen}
									onToggle={(event) =>
										setExpanded((current) => ({
											...current,
											[item.id]: (event.currentTarget as HTMLDetailsElement).open,
										}))
									}
								>
									<summary className="qitem__summary">
										<span className="qitem__main">
											<span className="qitem__title">{item.title}</span>
											<span className="qitem__meta">
												{motherFullName(getMother(db, item.motherId))} · {subjectLabel(db, item.subject)}
												{last ? ` · آخرین پیام: ${formatTimestamp(last.createdAt)}` : ""}
											</span>
										</span>
										<span className="qitem__side">
											<Badge tone={QUESTION_STATUS_TONES[item.status]}>
												{QUESTION_STATUS_LABELS[item.status]}
											</Badge>
										</span>
									</summary>

									<div className="qitem__body">
										<ul className="thread">
											{item.messages.map((message) => (
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

										<Field label="پاسخ شما">
											<TextArea
												value={replies[item.id] ?? ""}
												onChange={(value) =>
													setReplies((current) => ({ ...current, [item.id]: value }))
												}
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
													).then(() => setReplies((current) => ({ ...current, [item.id]: "" })))
												}}
											>
												ارسال پاسخ
											</Button>
											{STATUS_ACTIONS.filter((status) => status !== item.status).map((status) => (
												<Button
													key={status}
													variant="ghost"
													size="sm"
													onClick={() => {
														void mutate((current) => setQuestionStatus(current, item.id, status))
													}}
												>
													{QUESTION_STATUS_LABELS[status]}
												</Button>
											))}
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setReferralFor(item.id)
													setReferralForm({ ...referralForm, reason: item.title })
												}}
											>
												ارجاع به متخصص
											</Button>
										</Toolbar>
									</div>
								</details>
							)
						})}
					</div>
				)}
			</Card>

			<Modal open={referralFor !== null} title="ایجاد ارجاع" onClose={() => setReferralFor(null)}>
				{specialists.length === 0 ? (
					<Alert tone="warn">متخصصی در سامانه ثبت نشده است.</Alert>
				) : (
					<>
						<FormRow>
							<Field label="متخصص">
								<Select
									value={referralForm.specialistId}
									onChange={(value) => setReferralForm({ ...referralForm, specialistId: value })}
									options={specialists.map((specialist) => ({
										value: specialist.id,
										label: specialist.specialty
											? `${specialist.name} — ${specialist.specialty}`
											: specialist.name,
									}))}
								/>
							</Field>
							<Field label="فوریت">
								<Select
									value={referralForm.urgency}
									onChange={(value) =>
										setReferralForm({ ...referralForm, urgency: value as Urgency })
									}
									options={[
										{ value: "low", label: URGENCY_LABELS.low },
										{ value: "normal", label: URGENCY_LABELS.normal },
										{ value: "high", label: URGENCY_LABELS.high },
									]}
								/>
							</Field>
						</FormRow>
						<Field label="دلیل ارجاع">
							<TextInput
								value={referralForm.reason}
								onChange={(value) => setReferralForm({ ...referralForm, reason: value })}
							/>
						</Field>
						<Field label="خلاصه پرونده برای متخصص">
							<TextArea
								value={referralForm.summary}
								onChange={(value) => setReferralForm({ ...referralForm, summary: value })}
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
