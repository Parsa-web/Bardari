import { useEffect, useState } from "react"
import "./time-input.css"

const FA_DIGITS = "\u06f0\u06f1\u06f2\u06f3\u06f4\u06f5\u06f6\u06f7\u06f8\u06f9"
const AR_DIGITS = "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669"

/** ارقام فارسی/عربی را به انگلیسی تبدیل می‌کند. */
function toEnglishDigits(value: string): string {
	return value
		.split("")
		.map((char) => {
			const fa = FA_DIGITS.indexOf(char)
			if (fa >= 0) return String(fa)
			const ar = AR_DIGITS.indexOf(char)
			if (ar >= 0) return String(ar)
			return char
		})
		.join("")
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

function pad(value: number): string {
	return value < 10 ? `0${value}` : String(value)
}

type Parsed = { hour12: number; minute: number; pm: boolean }

function parse(value: string): Parsed {
	const [rawHour, rawMinute] = toEnglishDigits(value || "").split(":")
	const hour24 = clamp(Number(rawHour) || 0, 0, 23)
	const minute = clamp(Number(rawMinute) || 0, 0, 59)
	const pm = hour24 >= 12
	const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
	return { hour12, minute, pm }
}

function toValue(parsed: Parsed): string {
	const base = parsed.hour12 % 12
	const hour24 = parsed.pm ? base + 12 : base
	return `${pad(hour24)}:${pad(parsed.minute)}`
}

/**
 * ورودی ساعت با صفحه‌کلید.
 * - ساعت و دقیقه با عدد تایپ می‌شوند (فارسی یا انگلیسی).
 * - صبح/عصر با دکمه یا کلیدهای a / p قابل تغییر است.
 * - کلیدهای بالا/پایین مقدار را کم و زیاد می‌کنند.
 * مقدار ذخیره‌شده همیشه استاندارد و مرتب‌شدنی است: "HH:mm" ۲۴ ساعته.
 */
export function TimeInput({
	value,
	onChange,
	disabled,
}: {
	value: string
	onChange: (value: string) => void
	disabled?: boolean
}) {
	const parsed = parse(value)
	const [hourText, setHourText] = useState(pad(parsed.hour12))
	const [minuteText, setMinuteText] = useState(pad(parsed.minute))

	useEffect(() => {
		const next = parse(value)
		setHourText(pad(next.hour12))
		setMinuteText(pad(next.minute))
	}, [value])

	const commit = (next: Partial<Parsed>) => {
		onChange(toValue({ ...parsed, ...next }))
	}

	const handleHour = (raw: string) => {
		const digits = toEnglishDigits(raw).replace(/\D/g, "").slice(0, 2)
		setHourText(digits)
		if (digits === "") return
		commit({ hour12: clamp(Number(digits), 1, 12) })
	}

	const handleMinute = (raw: string) => {
		const digits = toEnglishDigits(raw).replace(/\D/g, "").slice(0, 2)
		setMinuteText(digits)
		if (digits === "") return
		commit({ minute: clamp(Number(digits), 0, 59) })
	}

	const step = (field: "hour" | "minute", delta: number) => {
		if (field === "hour") {
			const next = ((parsed.hour12 - 1 + delta + 12) % 12) + 1
			commit({ hour12: next })
		} else {
			const next = (parsed.minute + delta + 60) % 60
			commit({ minute: next })
		}
	}

	const keyHandler = (field: "hour" | "minute") => (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === "ArrowUp") {
			event.preventDefault()
			step(field, 1)
		} else if (event.key === "ArrowDown") {
			event.preventDefault()
			step(field, -1)
		} else if (event.key.toLowerCase() === "a") {
			event.preventDefault()
			commit({ pm: false })
		} else if (event.key.toLowerCase() === "p") {
			event.preventDefault()
			commit({ pm: true })
		}
	}

	return (
		<div className="time-input" dir="ltr">
			<input
				className="time-input__cell"
				value={hourText}
				onChange={(event) => handleHour(event.target.value)}
				onBlur={() => setHourText(pad(parse(value).hour12))}
				onKeyDown={keyHandler("hour")}
				inputMode="numeric"
				aria-label="ساعت"
				disabled={disabled}
				maxLength={2}
			/>
			<span className="time-input__sep">:</span>
			<input
				className="time-input__cell"
				value={minuteText}
				onChange={(event) => handleMinute(event.target.value)}
				onBlur={() => setMinuteText(pad(parse(value).minute))}
				onKeyDown={keyHandler("minute")}
				inputMode="numeric"
				aria-label="دقیقه"
				disabled={disabled}
				maxLength={2}
			/>
			<div className="time-input__period" role="group" aria-label="صبح یا عصر">
				<button
					type="button"
					className={`time-input__period-btn${parsed.pm ? "" : " is-active"}`}
					onClick={() => commit({ pm: false })}
					disabled={disabled}
				>
					صبح
				</button>
				<button
					type="button"
					className={`time-input__period-btn${parsed.pm ? " is-active" : ""}`}
					onClick={() => commit({ pm: true })}
					disabled={disabled}
				>
					عصر
				</button>
			</div>
		</div>
	)
}
