/**
 * قلاب مشترک بخش مراقبت.
 *
 * مادر فعلی، پرونده بارداری فعال و کادر درمان مرتبط را از منبع یکتا (AppDatabase) می‌خواند
 * و داده نمایشی همان مادر را یک‌بار می‌سازد.
 */

import { useEffect } from "react"
import { getAssignedMidwifeId, getPrimarySpecialistId, getProviderView } from "../../data/doctors"
import type { ProviderView } from "../../data/doctors"
import { getActivePregnancy } from "../../services/selectors"
import type { AppDatabase, Pregnancy } from "../../shared/types/domain"
import { useMotherContext } from "../mother/useMotherContext"
import { careActions, useCareState } from "./careStore"
import type { CareState } from "./careStore"

export type CareContext = {
	db: AppDatabase
	care: CareState
	motherId: string
	pregnancy: Pregnancy | null
	pregnancyId: string | null
	assignedMidwifeId: string | null
	assignedMidwife: ProviderView | null
	specialistId: string | null
}

export function useCare(): CareContext {
	const { db, motherId } = useMotherContext()
	const care = useCareState()

	const pregnancy = motherId ? getActivePregnancy(db, motherId) : null
	const pregnancyId = pregnancy?.id ?? null
	const assignedMidwifeId = motherId ? getAssignedMidwifeId(db, motherId) : null
	const specialistId = motherId ? getPrimarySpecialistId(db, motherId) : null

	useEffect(() => {
		if (!motherId) return
		careActions.ensureSeed({ motherId, pregnancyId, midwifeId: assignedMidwifeId, specialistId })
	}, [motherId, pregnancyId, assignedMidwifeId, specialistId])

	return {
		db,
		care,
		motherId,
		pregnancy,
		pregnancyId,
		assignedMidwifeId,
		assignedMidwife: getProviderView(db, assignedMidwifeId),
		specialistId,
	}
}
