import { useState } from "react"
import { Alert, Button, Card, Field, PageHeader } from "../../shared/components/ui"
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
		const reply = await chatbotService.ask(text)
		setTurns((current) => [
			...current,
			{ id: Date.now() + 1, role: "bot", text: reply.text, kind: reply.kind },
		])
		setBusy(false)
	}

	return (
		<>
			<PageHeader
				title="دستیار مراقبت"
				subtitle="پاسخ به پرسش‌های عمومی درباره بارداری و مراقبت مادر و کودک"
			/>

			<Alert tone="info">{CHATBOT_DISCLAIMER}</Alert>

			<Card title="گفتگو">
				<div className="chat">
					{turns.length === 0 && (
						<div className="chat__hint">
							<p className="muted">می‌توانید از این نمونه‌ها شروع کنید:</p>
							<div className="chat__chips">
								{CHATBOT_SUGGESTIONS.map((suggestion) => (
									<button
										key={suggestion}
										className="chip"
										type="button"
										onClick={() => {
											void send(suggestion)
										}}
									>
										{suggestion}
									</button>
								))}
							</div>
						</div>
					)}
					{turns.map((turn) => (
						<div
							key={turn.id}
							className={`bubble bubble--${turn.role}${
								turn.kind === "safety" ? " bubble--safety" : ""
							}`}
						>
							{turn.text}
						</div>
					))}
				</div>

				<Field label="پرسش شما">
					<textarea
						className="input input--area"
						value={input}
						placeholder="مانند: در دوران بارداری چه ورزشی مناسب است؟"
						onChange={(event) => setInput(event.target.value)}
					/>
				</Field>
				<Button
					variant="primary"
					disabled={busy || !input.trim()}
					onClick={() => {
						void send(input)
					}}
				>
					{busy ? "در حال پاسخ…" : "ارسال پرسش"}
				</Button>
			</Card>
		</>
	)
}
