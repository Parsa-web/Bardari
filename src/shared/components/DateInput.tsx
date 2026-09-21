import { useEffect, useState } from "react"
import {
	JALALI_MONTHS,
	isoToJalali,
	jalaliMonthLength,
	jalaliToIso,
	todayJalali,
} from "../utils/jalali"
import { formatDateLong, toFa } from "../utils/date"
import { CustomSelect } from "./CustomSelect"
import type { SelectOption } from "./CustomSelect"

/**
 * ورودی تاریخ شمسی.
 * مقدار بیرونی همیشه ISO میلادی (YYYY-MM-DD) است؛ کاربر فقط شمسی می‌بیند و شمسی وارد می‌کند.
 * هر سه انتخابگر از دراپ‌داون سفارشی (Portal + fixed) استفاده می‌کنند؛ پس هیچ‌گاه زیر لایه‌های دیگر نمی‌روند.
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

	const yearOptions: SelectOption[] = []
	for (let year = today.jy + yearsAhead; year >= today.jy - yearsBack; year -= 1) {
		yearOptions.push({ value: String(year), label: toFa(year) })
	}

	const monthLength =
		draft.y && draft.m ? jalaliMonthLength(Number(draft.y), Number(draft.m)) : 31
	const dayOptions: SelectOption[] = []
	for (let day = 1; day <= monthLength; day += 1) {
		dayOptions.push({ value: String(day), label: toFa(day) })
	}

	const monthOptions: SelectOption[] = JALALI_MONTHS.map((name, index) => ({
		value: String(index + 1),
		label: name,
	}))

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

	return (
		<span className="datefield">
			<span className="datefield__row">
				<CustomSelect
					label="روز"
					placeholder="روز"
					disabled={disabled}
					invalid={invalid}
					value={draft.d}
					options={dayOptions}
					onChange={(next) => apply({ ...draft, d: next })}
				/>
				<CustomSelect
					label="ماه"
					placeholder="ماه"
					disabled={disabled}
					invalid={invalid}
					value={draft.m}
					options={monthOptions}
					onChange={(next) => apply({ ...draft, m: next })}
				/>
				<CustomSelect
					label="سال"
					placeholder="سال"
					disabled={disabled}
					invalid={invalid}
					value={draft.y}
					options={yearOptions}
					onChange={(next) => apply({ ...draft, y: next })}
				/>
			</span>
			{showPreview && value && (
				<span className="datefield__preview">{formatDateLong(value)}</span>
			)}
		</span>
	)
}
