/**
 * فهرست نمایشی ماماها و پزشکان سامانه و ماما مسئول هر مادر.
 * این فایل فقط داده است و هیچ منطق UI ندارد.
 */

export type CareProviderRole = "midwife" | "doctor"

export const CARE_PROVIDER_ROLE_LABELS: Record<CareProviderRole, string> = {
	midwife: "ماما",
	doctor: "پزشک",
}

export type CareProvider = {
	id: string
	name: string
	role: CareProviderRole
	specialty: string
	clinic: string
	phone: string
}

export const CARE_PROVIDERS: ReadonlyArray<CareProvider> = [
	{
		id: "prv-midwife-1",
		name: "مریم رضایی",
		role: "midwife",
		specialty: "مراقبت دوران بارداری",
		clinic: "مرکز بهداشت شماره ۲",
		phone: "۰۹۱۳۰۰۰۰۰۰۱",
	},
	{
		id: "prv-midwife-2",
		name: "سمیه کریمی",
		role: "midwife",
		specialty: "آموزش زایمان و شیردهی",
		clinic: "درمانگاه مهر",
		phone: "۰۹۱۳۰۰۰۰۰۰۴",
	},
	{
		id: "prv-midwife-3",
		name: "زهرا موسوی",
		role: "midwife",
		specialty: "مراقبت پس از زایمان",
		clinic: "مرکز بهداشت شماره ۵",
		phone: "۰۹۱۳۰۰۰۰۰۰۵",
	},
	{
		id: "prv-doctor-1",
		name: "دکتر نازنین حسینی",
		role: "doctor",
		specialty: "زنان و زایمان",
		clinic: "کلینیک تخصصی امید",
		phone: "۰۹۱۳۰۰۰۰۰۰۲",
	},
	{
		id: "prv-doctor-2",
		name: "دکتر امیر صادقی",
		role: "doctor",
		specialty: "پریناتولوژی (بارداری پرخطر)",
		clinic: "بیمارستان مادر و کودک",
		phone: "۰۹۱۳۰۰۰۰۰۰۳",
	},
	{
		id: "prv-doctor-3",
		name: "دکتر شیما بهرامی",
		role: "doctor",
		specialty: "کودکان و نوزادان",
		clinic: "کلینیک کودکان بهار",
		phone: "۰۹۱۳۰۰۰۰۰۰۶",
	},
]

/** ماما مسئول پیش‌فرض برای مادرانی که تخصیص اختصاصی ندارند. */
export const DEFAULT_ASSIGNED_MIDWIFE_ID = "prv-midwife-1"

/** تخصیص ماما بر اساس شناسه مادر (Mother: { id, assignedMidwifeId }). */
export const ASSIGNED_MIDWIFE_BY_MOTHER: Record<string, string> = {
	"mother-2": "prv-midwife-2",
	"mother-3": "prv-midwife-3",
}

export function getCareProvider(id: string): CareProvider | null {
	return CARE_PROVIDERS.find((provider) => provider.id === id) ?? null
}

export function getCareProviderName(id: string): string {
	return getCareProvider(id)?.name ?? "—"
}

/** شناسه ماما مسئول یک مادر. */
export function getAssignedMidwifeId(motherId: string): string {
	return ASSIGNED_MIDWIFE_BY_MOTHER[motherId] ?? DEFAULT_ASSIGNED_MIDWIFE_ID
}

export function careProviderOptions(role?: CareProviderRole): Array<{ value: string; label: string }> {
	return CARE_PROVIDERS.filter((provider) => (role ? provider.role === role : true)).map((provider) => ({
		value: provider.id,
		label: `${provider.name} — ${CARE_PROVIDER_ROLE_LABELS[provider.role]} · ${provider.specialty}`,
	}))
}
