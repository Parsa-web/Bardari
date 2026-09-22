/**
 * انتخابگر مشترک کودک.
 *
 * همه بخش‌های مرتبط با کودک (کودکان، سلامت کودک، رشد، واکسن، مراحل تحول) از همین انتخابگر
 * استفاده می‌کنند تا کودک انتخاب‌شده در تمام صفحات یکسان باشد و هیچ‌گاه داده دو کودک قاطی نشود.
 */

import { useEffect, useState } from "react"
import type { Child } from "../types/domain"

const STORAGE_KEY = "mcc.selectedChild.v1"

let selectedChildId: string = readInitial()
const listeners = new Set<() => void>()

function readInitial(): string {
	if (typeof window === "undefined") return ""
	try {
		return window.localStorage.getItem(STORAGE_KEY) ?? ""
	} catch {
		return ""
	}
}

export function setSelectedChildId(childId: string) {
	if (selectedChildId === childId) return
	selectedChildId = childId
	try {
		if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, childId)
	} catch {
		/* ذخیره‌سازی اختیاری است */
	}
	listeners.forEach((listener) => listener())
}

export type SelectedChild = {
	child: Child | null
	childId: string
	selectChild: (childId: string) => void
	options: Array<{ value: string; label: string }>
}

/**
 * کودک انتخاب‌شده را براساس فهرست کودکان مادر برمی‌گرداند.
 * اگر کودک ذخیره‌شده متعلق به این مادر نباشد، اولین کودک معتبر انتخاب می‌شود.
 */
export function useSelectedChild(children: Child[]): SelectedChild {
	const [current, setCurrent] = useState<string>(selectedChildId)

	useEffect(() => {
		const listener = () => setCurrent(selectedChildId)
		listeners.add(listener)
		listener()
		return () => {
			listeners.delete(listener)
		}
	}, [])

	const valid = children.some((child) => child.id === current)
	const effectiveId = valid ? current : (children[0]?.id ?? "")

	useEffect(() => {
		if (effectiveId && effectiveId !== selectedChildId) setSelectedChildId(effectiveId)
	}, [effectiveId])

	return {
		child: children.find((child) => child.id === effectiveId) ?? null,
		childId: effectiveId,
		selectChild: setSelectedChildId,
		options: children.map((child) => ({ value: child.id, label: child.name })),
	}
}
