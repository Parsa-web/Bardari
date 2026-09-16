import type {
	AppDatabase,
	AuthAccount,
	Mother,
	MotherCurrentStatus,
	Pregnancy,
	Role,
} from "../../shared/types/domain"
import { addDays, diffInDays, nowIsoTimestamp, todayIso } from "../../shared/utils/date"
import { createId } from "../../shared/utils/id"

/**
 * لایه احراز هویت نمایشی.
 *
 * این سرویس هیچ سرور، API، پیامک یا احراز هویت واقعی ندارد؛ همه کار در مرورگر انجام
 * می‌شود. رابط کاربری فقط با همین قرارداد کار می‌کند، پس در آینده می‌توان پیاده‌سازی
 * را با یک سرویس واقعی جایگزین کرد بدون تغییر صفحات.
 */

export type AuthSession = {
	role: Role
	motherId?: string | null
	providerId?: string | null
	displayName: string
}

export type SignInInput = { phone: string; password: string }

export type SignInOutcome =
	| { ok: true; session: AuthSession }
	| { ok: false; reason: "unknown_phone" | "wrong_password" | "broken_account" }

export type RegisterMotherInput = {
	firstName: string
	lastName: string
	phone: string
	password: string
	birthDate?: string | null
	currentStatus: MotherCurrentStatus
	/** فقط وقتی مادر اعلام کرده باردار است */
	pregnancy?: { lmpDate?: string | null; eddDate?: string | null } | null
}

export type RegisterMotherOutcome =
	| { ok: true; db: AppDatabase; session: AuthSession; motherId: string; pregnancyId: string | null }
	| { ok: false; reason: "duplicate_phone" }

/** تبدیل ارقام فارسی/عربی به لاتین و حذف جداکننده‌ها */
export function normalizePhone(raw: string): string {
	const latin = raw
		.replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
		.replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
	return latin.replace(/\D/g, "")
}

export function isValidIranianMobile(raw: string): boolean {
	return /^09\d{9}$/.test(normalizePhone(raw))
}

export const MIN_PASSWORD_LENGTH = 6

/**
 * اثر یک‌طرفه ساده برای نسخه نمایشی، تا رمز به متن ساده در مرورگر ذخیره نشود.
 * این یک مکانیزم امنیتی واقعی نیست و جایگزین هش سمت سرور نمی‌شود.
 */
export function hashSecret(value: string): string {
	let hash = 5381
	for (let index = 0; index < value.length; index += 1) {
		hash = ((hash * 33) ^ value.charCodeAt(index)) >>> 0
	}
	return `demo1:${hash.toString(36)}`
}

function findAccount(db: AppDatabase, phone: string): AuthAccount | undefined {
	const normalized = normalizePhone(phone)
	return db.accounts.find((account) => normalizePhone(account.phone) === normalized)
}

export function isPhoneTaken(db: AppDatabase, phone: string): boolean {
	return Boolean(findAccount(db, phone))
}

/** اعتبارسنجی تاریخ شروع آخرین قاعدگی؛ پیام فارسی یا null */
export function validateLmpDate(iso: string): string | null {
	if (!iso) return null
	const elapsed = diffInDays(iso, todayIso())
	if (elapsed === null) return "تاریخ واردشده معتبر نیست."
	if (elapsed < 0) return "این تاریخ نمی‌تواند در آینده باشد."
	if (elapsed > 315) return "این تاریخ برای یک بارداری جاری خیلی دور است."
	return null
}

/** تاریخ تخمینی زایمان از تاریخ قاعدگی؛ اگر داده ناکافی باشد null */
export function estimateEdd(lmpDate?: string | null): string | null {
	if (!lmpDate) return null
	if (validateLmpDate(lmpDate)) return null
	return addDays(lmpDate, 280)
}

function delay(ms = 220): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}

function sessionFromAccount(db: AppDatabase, account: AuthAccount): AuthSession | null {
	if (account.role === "mother") {
		const mother = db.mothers.find((item) => item.id === account.motherId)
		if (!mother) return null
		return {
			role: "mother",
			motherId: mother.id,
			displayName: `${mother.firstName} ${mother.lastName}`.trim(),
		}
	}
	const provider = db.providers.find((item) => item.id === account.providerId)
	if (!provider) return null
	return { role: provider.role, providerId: provider.id, displayName: provider.name }
}

export const authService = {
	/** ورود نمایشی با شماره موبایل و رمز ذخیره‌شده در همین مرورگر */
	async signIn(db: AppDatabase, input: SignInInput): Promise<SignInOutcome> {
		await delay()
		const account = findAccount(db, input.phone)
		if (!account) return { ok: false, reason: "unknown_phone" }
		if (account.passwordHash !== hashSecret(input.password)) {
			return { ok: false, reason: "wrong_password" }
		}
		const session = sessionFromAccount(db, account)
		if (!session) return { ok: false, reason: "broken_account" }
		return { ok: true, session }
	},

	/**
	 * ثبت‌نام مادر جدید.
	 * اول موجودیت Mother ساخته می‌شود و در صورت نیاز، Pregnancy به‌صورت موجودیت جداگانه.
	 * خروجی یک نسخه جدید از پایگاه داده است؛ ذخیره‌سازی بر عهده لایه Repository است.
	 */
	async registerMother(
		db: AppDatabase,
		input: RegisterMotherInput,
	): Promise<RegisterMotherOutcome> {
		await delay()
		const phone = normalizePhone(input.phone)
		if (isPhoneTaken(db, phone)) return { ok: false, reason: "duplicate_phone" }

		const createdAt = nowIsoTimestamp()
		const midwifeId = db.providers.find((provider) => provider.role === "midwife")?.id

		const mother: Mother = {
			id: createId("mo"),
			firstName: input.firstName.trim(),
			lastName: input.lastName.trim(),
			phone,
			birthDate: input.birthDate ? input.birthDate : null,
			careTeam: { midwifeId, specialistIds: [] },
			currentStatus: input.currentStatus,
			createdAt,
		}

		const pregnancies: Pregnancy[] = []
		if (input.currentStatus === "pregnant") {
			const lmpDate = input.pregnancy?.lmpDate ? input.pregnancy.lmpDate : null
			const eddDate = input.pregnancy?.eddDate
				? input.pregnancy.eddDate
				: estimateEdd(lmpDate)
			pregnancies.push({
				id: createId("pg"),
				motherId: mother.id,
				label: "بارداری جاری",
				status: "active",
				lmpDate,
				eddDate,
				createdAt,
				birth: null,
			})
		}

		const account: AuthAccount = {
			id: createId("au"),
			role: "mother",
			phone,
			passwordHash: hashSecret(input.password),
			displayName: `${mother.firstName} ${mother.lastName}`.trim(),
			motherId: mother.id,
			providerId: null,
			createdAt,
		}

		const next: AppDatabase = {
			...db,
			mothers: [...db.mothers, mother],
			accounts: [...db.accounts, account],
			pregnancies: [...db.pregnancies, ...pregnancies],
		}

		return {
			ok: true,
			db: next,
			session: {
				role: "mother",
				motherId: mother.id,
				displayName: account.displayName,
			},
			motherId: mother.id,
			pregnancyId: pregnancies[0]?.id ?? null,
		}
	},
}
