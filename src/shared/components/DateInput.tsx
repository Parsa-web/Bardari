import { useEffect, useState } from "react"
import {
	JALALI_MONTHS,
	isoToJalali,
	jalaliMonthLength,
	jalaliToIso,
	todayJalali,
} from "../utils/jalali"
import { formatDateLong, toFa } from "../utils/date"

/**
 * ورودی تاریخ شمسی.
 * مقدار بیرونی همیشه ISO میلادی (YYYY-MM-DD) است؛ کاربر فقط شمسی می‌بیند و شمسی وارد می‌کند.
 */
type Draft = { y: string; m: string; d: string }

function draftFromIso(iso?: string | null): Draft {
	const parts = isoToJalali(iso)
	if (!parts) return { y: "", m: "", d: "" }
	return { y: String(parts.jy), m: String(parts.jm), d: String(parts.jd) }
}

export function JalaliDateInput({
	value,
	onChange,
	disabled,
	invalid,
	yearsBack = 100,
	yearsAhead = 2,
	showPreview = true,
}: {
	value: string
	onChange: (isoDate: string) => void
	disabled?: boolean
	invalid?: boolean
	yearsBack?: number
	yearsAhead?: number
	showPreview?: boolean
}) {
	const today = todayJalali()
	const [draft, setDraft] = useState<Draft>(() => draftFromIso(value))

	useEffect(() => {
		const next = draftFromIso(value)
		setDraft((current) => {
			if (!value) return current.y || current.m || current.d ? current : { y: "", m: "", d: "" }
			if (current.y === next.y && current.m === next.m && current.d === next.d) return current
			return next
		})
	}, [value])

	const years: number[] = []
	for (let year = today.jy + yearsAhead; year >= today.jy - yearsBack; year -= 1) years.push(year)

	const monthLength =
		draft.y && draft.m ? jalaliMonthLength(Number(draft.y), Number(draft.m)) : 31
	const days: number[] = []
	for (let day = 1; day <= monthLength; day += 1) days.push(day)

	const apply = (next: Draft) => {
		let fixed = next
		if (fixed.y && fixed.m && fixed.d) {
			const maxDay = jalaliMonthLength(Number(fixed.y), Number(fixed.m))
			if (Number(fixed.d) > maxDay) fixed = { ...fixed, d: String(maxDay) }
		}
		setDraft(fixed)
		if (fixed.y && fixed.m && fixed.d) {
			const iso = jalaliToIso(Number(fixed.y), Number(fixed.m), Number(fixed.d))
			onChange(iso ?? "")
		} else {
			onChange("")
		}
	}

	const selectClass = `input input--select${invalid ? " input--invalid" : ""}`

	return (
		<span className="datefield">
			<span className="datefield__row">
				<select
					className={selectClass}
					aria-label="روز"
					disabled={disabled}
					value={draft.d}
					onChange={(event) => apply({ ...draft, d: event.target.value })}
				>
					<option value="">روز</option>
					{days.map((day) => (
						<option key={day} value={String(day)}>
							{toFa(day)}
						</option>
					))}
				</select>
				<select
					className={selectClass}
					aria-label="ماه"
					disabled={disabled}
					value={draft.m}
					onChange={(event) => apply({ ...draft, m: event.target.value })}
				>
					<option value="">ماه</option>
					{JALALI_MONTHS.map((name, index) => (
						<option key={name} value={String(index + 1)}>
							{name}
						</option>
					))}
				</select>
				<select
					className={selectClass}
					aria-label="سال"
					disabled={disabled}
					value={draft.y}
					onChange={(event) => apply({ ...draft, y: event.target.value })}
				>
					<option value="">سال</option>
					{years.map((year) => (
						<option key={year} value={String(year)}>
							{toFa(year)}
						</option>
					))}
				</select>
			</span>
			{showPreview && value && (
				<span className="datefield__preview">{formatDateLong(value)}</span>
			)}
		</span>
	)
}
