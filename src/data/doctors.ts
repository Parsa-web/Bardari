/**
 * دفترچه واحد کادر درمان (ماما و متخصص).
 *
 * منبع یکتا: db.providers در AppDatabase.
 * هیچ فهرست موازی ماما/پزشک در این فایل نگهداری نمی‌شود و ماما مسئول هر مادر
 * فقط از mother.careTeam.midwifeId خوانده می‌شود.
 */

import type { AppDatabase, CareProvider } from "../shared/types/domain"

export type CareProviderRole = CareProvider["role"]

export const CARE_PROVIDER_ROLE_LABELS: Record<CareProviderRole, string> = {
	midwife: "ماما",
	specialist: "پزشک متخصص",
}

/**
 * شماره تماس نمایشی تا زمان اتصال به بک‌اند.
 * کلید آن شناسه پایدار ارائه‌دهنده است، نه نام او.
 */
const PROVIDER_PHONES: Record<string, string> = {
	mw_1: "۰۹۱۳۰۰۰۰۰۰۱",
	sp_1: "۰۹۱۳۰۰۰۰۰۰۲",
	sp_2: "۰۹۱۳۰۰۰۰۰۰۳",
}

/** نمای نمایشی ارائه‌دهنده؛ رکوردها همیشه با شناسه به او وصل می‌شوند. */
export type ProviderView = {
	id: string
	name: string
	role: CareProviderRole
	specialty: string
	clinic: string
	phone: string
}

function toView(provider: CareProvider): ProviderView {
	return {
		id: provider.id,
		name: provider.name,
		role: provider.role,
		specialty: provider.specialty ?? CARE_PROVIDER_ROLE_LABELS[provider.role],
		clinic: provider.center ?? "ثبت نشده",
		phone: PROVIDER_PHONES[provider.id] ?? "ثبت نشده",
	}
}

export function listProviders(db: AppDatabase, role?: CareProviderRole): ProviderView[] {
	return db.providers.filter((provider) => (role ? provider.role === role : true)).map(toView)
}

export function getProviderView(db: AppDatabase, providerId?: string | null): ProviderView | null {
	if (!providerId) return null
	const found = db.providers.find((provider) => provider.id === providerId)
	return found ? toView(found) : null
}

export function providerDisplayName(db: AppDatabase, providerId?: string | null): string {
	return getProviderView(db, providerId)?.name ?? "ثبت نشده"
}

/** ماما مسئول مادر؛ تنها منبع آن careTeam.midwifeId است. */
export function getAssignedMidwifeId(db: AppDatabase, motherId: string): string | null {
	return db.mothers.find((mother) => mother.id === motherId)?.careTeam.midwifeId ?? null
}

/** متخصص مرتبط با مادر (اولین متخصص تیم مراقبت). */
export function getPrimarySpecialistId(db: AppDatabase, motherId: string): string | null {
	const mother = db.mothers.find((item) => item.id === motherId)
	if (mother && mother.careTeam.specialistIds.length > 0) return mother.careTeam.specialistIds[0]
	return db.providers.find((provider) => provider.role === "specialist")?.id ?? null
}

export function providerOptions(
	db: AppDatabase,
	role?: CareProviderRole,
): Array<{ value: string; label: string }> {
	return listProviders(db, role).map((provider) => ({
		value: provider.id,
		label: `${provider.name} — ${CARE_PROVIDER_ROLE_LABELS[provider.role]} · ${provider.specialty}`,
	}))
}
