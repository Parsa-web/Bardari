import { useRef } from "react"
import { Icon } from "./icons"
import type { IconName } from "./icons"
import "./SegmentedControl.css"

/**
 * انتخابگر بخشی (segmented) با زبان بصری یکسان با دراپ‌داون سفارشی.
 * الگوی دسترسی‌پذیر: tablist/tab با پیمایش کلید جهت‌ها.
 */
export type SegmentOption = {
	value: string
	label: string
	icon?: IconName
}

export function SegmentedControl({
	value,
	onChange,
	options,
	label,
	size = "md",
}: {
	value: string
	onChange: (value: string) => void
	options: ReadonlyArray<SegmentOption>
	label?: string
	size?: "md" | "sm"
}) {
	const listRef = useRef<HTMLDivElement | null>(null)

	const focusAt = (index: number) => {
		const count = options.length
		if (count === 0) return
		const next = (index + count) % count
		const option = options[next]
		if (!option) return
		onChange(option.value)
		const node = listRef.current?.children[next] as HTMLElement | undefined
		node?.focus()
	}

	const currentIndex = options.findIndex((option) => option.value === value)

	return (
		<div
			ref={listRef}
			className={`segmented${size === "sm" ? " segmented--sm" : ""}`}
			role="tablist"
			aria-label={label}
		>
			{options.map((option) => {
				const isActive = option.value === value
				return (
					<button
						key={option.value}
						type="button"
						role="tab"
						aria-selected={isActive}
						tabIndex={isActive ? 0 : -1}
						className={`segmented__item${isActive ? " is-active" : ""}`}
						onClick={() => onChange(option.value)}
						onKeyDown={(event) => {
							/* در RTL کلید چپ یعنی گزینه بعدی */
							if (event.key === "ArrowLeft") {
								event.preventDefault()
								focusAt(currentIndex + 1)
							} else if (event.key === "ArrowRight") {
								event.preventDefault()
								focusAt(currentIndex - 1)
							} else if (event.key === "Home") {
								event.preventDefault()
								focusAt(0)
							} else if (event.key === "End") {
								event.preventDefault()
								focusAt(options.length - 1)
							}
						}}
					>
						{option.icon && <Icon name={option.icon} size={size === "sm" ? 15 : 17} />}
						<span>{option.label}</span>
					</button>
				)
			})}
		</div>
	)
}
