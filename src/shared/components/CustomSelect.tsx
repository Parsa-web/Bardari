import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Icon } from "./icons"
import "./CustomSelect.css"

/**
 * دراپ‌داون سفارشی و قابل استفاده دوباره.
 * جایگزین کامل منوی پیش‌فرض مرورگر است: راست‌به‌چپ، تم روشن/تاریک،
 * پیمایش کامل با صفحه‌کلید و الگوی دسترسی‌پذیر combobox/listbox.
 *
 * مهم: منو با Portal مستقیماً زیر <body> رندر می‌شود و موقعیتش fixed است؛
 * بنابراین هیچ کارت، هدر چسبان، overflow:hidden یا transform والدی
 * نمی‌تواند آن را ببرد زیر لایه‌های دیگر یا ببردد.
 */
export type SelectOption = {
	value: string
	label: string
	hint?: string
	disabled?: boolean
}

export type CustomSelectProps = {
	value: string
	onChange: (value: string) => void
	options: ReadonlyArray<SelectOption>
	placeholder?: string
	disabled?: boolean
	invalid?: boolean
	inline?: boolean
	label?: string
	emptyText?: string
}

type MenuPosition = {
	left: number
	width: number
	top: number
	maxHeight: number
	up: boolean
}

const GAP = 8
const MIN_SPACE = 180
const MAX_MENU_HEIGHT = 288

export function CustomSelect({
	value,
	onChange,
	options,
	placeholder = "انتخاب کنید",
	disabled,
	invalid,
	inline,
	label,
	emptyText = "گزینه‌ای موجود نیست",
}: CustomSelectProps) {
	const [open, setOpen] = useState(false)
	const [activeIndex, setActiveIndex] = useState(-1)
	const [position, setPosition] = useState<MenuPosition | null>(null)
	const buttonRef = useRef<HTMLButtonElement | null>(null)
	const listRef = useRef<HTMLUListElement | null>(null)
	const listId = useId().replace(/:/g, "")

	const selectedIndex = useMemo(
		() => options.findIndex((option) => option.value === value),
		[options, value],
	)
	const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined

	/** محاسبه محل قرارگیری منو نسبت به دکمه (مختصات viewport). */
	const measure = useCallback(() => {
		const rect = buttonRef.current?.getBoundingClientRect()
		if (!rect) return
		const spaceBelow = window.innerHeight - rect.bottom - GAP
		const spaceAbove = rect.top - GAP
		const up = spaceBelow < MIN_SPACE && spaceAbove > spaceBelow
		const available = Math.max(140, Math.min(MAX_MENU_HEIGHT, up ? spaceAbove : spaceBelow))
		setPosition({
			left: Math.round(rect.left),
			width: Math.round(rect.width),
			top: Math.round(up ? rect.top - GAP : rect.bottom + GAP),
			maxHeight: Math.round(available),
			up,
		})
	}, [])

	useLayoutEffect(() => {
		if (!open) return
		measure()
	}, [open, measure, options.length])

	/* همگام‌سازی موقعیت با اسکرول/تغییر اندازه و بستن با کلیک بیرون */
	useEffect(() => {
		if (!open) return
		const onPointerDown = (event: PointerEvent) => {
			const target = event.target as Node
			if (buttonRef.current?.contains(target)) return
			if (listRef.current?.contains(target)) return
			setOpen(false)
		}
		const onScrollOrResize = () => {
			const rect = buttonRef.current?.getBoundingClientRect()
			/* اگر دکمه از صفحه خارج شد، منو بسته می‌شود؛ وگرنه دنبالش می‌آید. */
			if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) {
				setOpen(false)
				return
			}
			measure()
		}
		document.addEventListener("pointerdown", onPointerDown, true)
		window.addEventListener("resize", onScrollOrResize)
		window.addEventListener("scroll", onScrollOrResize, true)
		return () => {
			document.removeEventListener("pointerdown", onPointerDown, true)
			window.removeEventListener("resize", onScrollOrResize)
			window.removeEventListener("scroll", onScrollOrResize, true)
		}
	}, [open, measure])

	/* نگه‌داشتن گزینه فعال در محدوده دید */
	useEffect(() => {
		if (!open || activeIndex < 0) return
		const node = listRef.current?.children[activeIndex] as HTMLElement | undefined
		node?.scrollIntoView({ block: "nearest" })
	}, [open, activeIndex])

	const firstEnabled = () => options.findIndex((option) => !option.disabled)

	const stepIndex = (from: number, direction: 1 | -1) => {
		const count = options.length
		if (count === 0) return -1
		let index = from < 0 ? (direction === 1 ? -1 : 0) : from
		for (let attempt = 0; attempt < count; attempt += 1) {
			index = (index + direction + count) % count
			if (!options[index]?.disabled) return index
		}
		return from
	}

	const openMenu = (startIndex?: number) => {
		if (disabled) return
		measure()
		setActiveIndex(startIndex ?? (selectedIndex >= 0 ? selectedIndex : firstEnabled()))
		setOpen(true)
	}

	const closeMenu = (focusControl = true) => {
		setOpen(false)
		if (focusControl) buttonRef.current?.focus()
	}

	const commit = (index: number) => {
		const option = options[index]
		if (!option || option.disabled) return
		onChange(option.value)
		closeMenu()
	}

	const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
		if (disabled) return
		switch (event.key) {
			case "ArrowDown":
			case "ArrowUp": {
				event.preventDefault()
				const direction = event.key === "ArrowDown" ? 1 : -1
				if (!open) openMenu()
				else setActiveIndex((current) => stepIndex(current, direction))
				break
			}
			case "Home":
				if (open) {
					event.preventDefault()
					setActiveIndex(firstEnabled())
				}
				break
			case "End":
				if (open) {
					event.preventDefault()
					setActiveIndex(stepIndex(0, -1))
				}
				break
			case "Enter":
			case " ":
			case "Spacebar":
				event.preventDefault()
				if (!open) openMenu()
				else commit(activeIndex)
				break
			case "Escape":
				if (open) {
					event.preventDefault()
					closeMenu()
				}
				break
			case "Tab":
				if (open) setOpen(false)
				break
			default:
				break
		}
	}

	const classes = [
		"cselect",
		inline ? "cselect--inline" : "",
		open ? "is-open" : "",
		disabled ? "is-disabled" : "",
		invalid ? "is-invalid" : "",
	]
		.filter(Boolean)
		.join(" ")

	const menu =
		open && position && typeof document !== "undefined"
			? createPortal(
					<ul
						ref={listRef}
						id={listId}
						className={`cselect__menu${position.up ? " cselect__menu--up" : ""}`}
						role="listbox"
						dir="rtl"
						aria-label={label}
						style={{
							left: position.left,
							width: position.width,
							top: position.up ? undefined : position.top,
							bottom: position.up ? window.innerHeight - position.top : undefined,
							maxHeight: position.maxHeight,
						}}
					>
						{options.length === 0 && <li className="cselect__empty">{emptyText}</li>}
						{options.map((option, index) => {
							const isSelected = option.value === value
							const itemClasses = [
								"cselect__option",
								isSelected ? "is-selected" : "",
								index === activeIndex ? "is-active" : "",
								option.disabled ? "is-disabled" : "",
							]
								.filter(Boolean)
								.join(" ")
							return (
								<li
									key={option.value}
									id={`${listId}-${index}`}
									className={itemClasses}
									role="option"
									aria-selected={isSelected}
									aria-disabled={option.disabled || undefined}
									onMouseEnter={() => !option.disabled && setActiveIndex(index)}
									onClick={() => commit(index)}
								>
									<span className="cselect__option-text">
										<span className="cselect__option-label">{option.label}</span>
										{option.hint && <span className="cselect__option-hint">{option.hint}</span>}
									</span>
									{isSelected && (
										<span className="cselect__check" aria-hidden="true">
											<Icon name="check" size={16} />
										</span>
									)}
								</li>
							)
						})}
					</ul>,
					document.body,
				)
			: null

	return (
		<div className={classes}>
			<button
				ref={buttonRef}
				type="button"
				className="cselect__control"
				role="combobox"
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={open ? listId : undefined}
				aria-label={label}
				aria-invalid={invalid || undefined}
				aria-activedescendant={open && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
				disabled={disabled}
				onClick={() => (open ? closeMenu(false) : openMenu())}
				onKeyDown={onKeyDown}
			>
				<span className={`cselect__value${selected ? "" : " cselect__value--placeholder"}`}>
					{selected?.label ?? placeholder}
				</span>
				<span className="cselect__arrow" aria-hidden="true">
					<Icon name="chevron" size={18} />
				</span>
			</button>
			{menu}
		</div>
	)
}
