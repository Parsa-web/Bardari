import { useState } from "react"
import { Alert, Button, Card, Field, Icon, PageHeader, TextArea } from "../../shared/components/ui"
import {
	CHATBOT_DISCLAIMER,
	CHATBOT_SUGGESTIONS,
	chatbotService,
	type ChatbotReplyKind,
} from "./chatbotService"

type Turn = { id: number; role: "user" | "bot"; text: string; kind?: ChatbotReplyKind }

export function AssistantPage() {
	const [input, setInput] = useState("")
	const [turns, setTurns] = useState<Turn[]>([])
	const [busy, setBusy] = useState(false)

	const send = async (question: string) => {
		const text = question.trim()
		if (!text || busy) return
		setBusy(true)
		const userTurn: Turn = { id: Date.now(), role: "user", text }
		setTurns((current) => [...current, userTurn])
		setInput("")
		try {
			const reply = await chatbotService.ask(text)
			setTurns((current) => [
				...current,
				{ id: Date.now() + 1, role: "bot", text: reply.text, kind: reply.kind },
			])
		} finally {
			setBusy(false)
		}
	}

	return (
		<>
			<PageHeader
				title="دستیار مراقبت"
				subtitle="محیط گفتگوی ویژه پرسش‌های مراقبت مادر و کودک"
				actions={
					turns.length > 0 ? (
						<Button variant="outline" icon="refresh" onClick={() => setTurns([])}>
							گفتگوی جدید
						</Button>
					) : undefined
				}
			/>

			<Alert tone="info">{CHATBOT_DISCLAIMER}</Alert>

			<Card title="گفتگو" subtitle="پیام‌های شما فقط در همین مرورگر و در همین گفتگو نگه داشته می‌شوند.">
				<div className="chat" role="log" aria-live="polite">
					{turns.length === 0 ? (
						<div className="state empty">
							<span className="state__icon">
								<Icon name="assistant" size={22} />
							</span>
							<p className="state__title">می‌توانید از این نمونه‌ها شروع کنید</p>
							<div className="chat__chips">
								{CHATBOT_SUGGESTIONS.map((suggestion) => (
									<button
										key={suggestion}
										className="chip"
										type="button"
										disabled={busy}
										onClick={() => {
											void send(suggestion)
										}}
									>
										{suggestion}
									</button>
								))}
							</div>
						</div>
					) : (
						turns.map((turn) => (
							<div
								key={turn.id}
								className={`bubble bubble--${turn.role}${turn.kind === "safety" ? " bubble--safety" : ""}`}
							>
								<p className="meta">{turn.role === "user" ? "شما" : "دستیار مراقبت"}</p>
								<p>{turn.text}</p>
							</div>
						))
					)}
				</div>

				<Field label="پرسش شما" hint="در موارد فوری و علامت هشدار، مستقیم با مراقب سلامت خود تماس بگیرید.">
					<TextArea
						value={input}
						disabled={busy}
						placeholder="مانند: در دوران بارداری چه ورزشی مناسب است؟"
						onChange={(value) => setInput(value)}
					/>
				</Field>
				<Button
					variant="primary"
					loading={busy}
					disabled={!input.trim()}
					onClick={() => {
						void send(input)
					}}
				>
					ارسال پرسش
				</Button>
			</Card>
		</>
	)
}
