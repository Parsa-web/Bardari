import type {
	Activity,
	AppDatabase,
	AppNotification,
	Checkup,
	CheckupViewStatus,
	Child,
	Mother,
	Pregnancy,
	QuestionCase,
	Referral,
	Role,
	SubjectRef,
} from "../shared/types/domain"
import { compareDateTime, daysUntil, todayIso } from "../shared/utils/date"

/** خواندن داده همیشه از این لایه انجام می‌شود؛ کامپوننت‌ها منطق جستجو ندارند. */

export const DUE_SOON_DAYS = 7

export function getMother(db: AppDatabase, motherId?: string | null): Mother | null {
	if (!motherId) return null
	return db.mothers.find((m) => m.id === motherId) ?? null
}

export function motherFullName(mother?: Mother | null): string {
	if (!mother) return "—"
	return `${mother.firstName} ${mother.lastName}`.trim()
}

export function getProviderName(db: AppDatabase, providerId?: string | null): string {
	if (!providerId) return "ثبت نشده"
	return db.providers.find((p) => p.id === providerId)?.name ?? "ثبت نشده"
}

export function getPregnancies(db: AppDatabase, motherId: string): Pregnancy[] {
	return db.pregnancies
		.filter((p) => p.motherId === motherId)
		.slice()
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function getActivePregnancy(db: AppDatabase, motherId: string): Pregnancy | null {
	return db.pregnancies.find((p) => p.motherId === motherId && p.status === "active") ?? null
}

export function getPregnancy(db: AppDatabase, id?: string | null): Pregnancy | null {
	if (!id) return null
	return db.pregnancies.find((p) => p.id === id) ?? null
}

export function getChildren(db: AppDatabase, motherId: string): Child[] {
	return db.children
		.filter((c) => c.motherId === motherId)
		.slice()
		.sort((a, b) => (a.birthDate < b.birthDate ? 1 : -1))
}

export function getChild(db: AppDatabase, id?: string | null): Child | null {
	if (!id) return null
	return db.children.find((c) => c.id === id) ?? null
}

export function subjectLabel(db: AppDatabase, subject?: SubjectRef | null): string {
	if (!subject) return "عمومی"
	if (subject.kind === "pregnancy") {
		return getPregnancy(db, subject.id)?.label ?? "بارداری"
	}
	if (subject.kind === "child") {
		const child = getChild(db, subject.id)
		return child ? `کودک: ${child.name}` : "کودک"
	}
	return motherFullName(getMother(db, subject.id))
}

export function sameSubject(a?: SubjectRef | null, b?: SubjectRef | null): boolean {
	if (!a || !b) return false
	return a.kind === b.kind && a.id === b.id
}

export function getActivities(
	db: AppDatabase,
	motherId: string,
	subject?: SubjectRef | null,
): Activity[] {
	return db.activities
		.filter((a) => a.motherId === motherId && (!subject || sameSubject(a.subject, subject)))
		.slice()
		.sort((a, b) => compareDateTime(b, a))
}

export function getTodayActivities(db: AppDatabase, motherId: string): Activity[] {
	const today = todayIso()
	return getActivities(db, motherId).filter((a) => a.date === today)
}

/** وضعیت نمایشی چکاپ؛ «نزدیک موعد» و «عقب‌افتاده» از تاریخ محاسبه می‌شوند. */
export function checkupViewStatus(checkup: Checkup): CheckupViewStatus {
	if (checkup.status !== "pending") return checkup.status
	const remaining = daysUntil(checkup.date)
	if (remaining === null) return "pending"
	if (remaining < 0) return "overdue"
	if (remaining <= DUE_SOON_DAYS) return "due_soon"
	return "pending"
}

export function getCheckups(
	db: AppDatabase,
	motherId: string,
	subject?: SubjectRef | null,
): Checkup[] {
	return db.checkups
		.filter((c) => c.motherId === motherId && (!subject || sameSubject(c.subject, subject)))
		.slice()
		.sort((a, b) => compareDateTime(a, b))
}

export function getUpcomingCheckups(db: AppDatabase, motherIds: string[]): Checkup[] {
	return db.checkups
		.filter((c) => motherIds.includes(c.motherId))
		.filter((c) => {
			const view = checkupViewStatus(c)
			return view === "due_soon" || view === "overdue"
		})
		.slice()
		.sort((a, b) => compareDateTime(a, b))
}

export function getQuestions(db: AppDatabase, filter: { motherId?: string; midwifeId?: string }): QuestionCase[] {
	return db.questions
		.filter((q) => (!filter.motherId || q.motherId === filter.motherId))
		.filter((q) => (!filter.midwifeId || q.midwifeId === filter.midwifeId))
		.slice()
		.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
}

export function getQuestion(db: AppDatabase, id?: string | null): QuestionCase | null {
	if (!id) return null
	return db.questions.find((q) => q.id === id) ?? null
}

export function isOpenQuestion(question: QuestionCase): boolean {
	return question.status === "open" || question.status === "in_review" || question.status === "needs_followup"
}

export function getReferrals(
	db: AppDatabase,
	filter: { motherId?: string; midwifeId?: string; specialistId?: string },
): Referral[] {
	return db.referrals
		.filter((r) => (!filter.motherId || r.motherId === filter.motherId))
		.filter((r) => (!filter.midwifeId || r.midwifeId === filter.midwifeId))
		.filter((r) => (!filter.specialistId || r.specialistId === filter.specialistId))
		.slice()
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function getReferral(db: AppDatabase, id?: string | null): Referral | null {
	if (!id) return null
	return db.referrals.find((r) => r.id === id) ?? null
}

export function getMothersOfMidwife(db: AppDatabase, midwifeId: string): Mother[] {
	return db.mothers.filter((m) => m.careTeam.midwifeId === midwifeId)
}

export function getNotifications(
	db: AppDatabase,
	audience: Role,
	motherId?: string | null,
): AppNotification[] {
	return db.notifications
		.filter((n) => n.audience === audience)
		.filter((n) => (audience === "mother" ? n.motherId === motherId : true))
		.slice()
		.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export function unreadCount(notifications: AppNotification[]): number {
	return notifications.filter((n) => !n.read).length
}

export function getVaccinations(db: AppDatabase, childId: string) {
	return db.vaccinations
		.filter((v) => v.childId === childId)
		.slice()
		.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
}

export function getGrowth(db: AppDatabase, childId: string) {
	return db.growth
		.filter((g) => g.childId === childId)
		.slice()
		.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getMilestones(db: AppDatabase, childId: string) {
	return db.milestones
		.filter((m) => m.childId === childId)
		.slice()
		.sort((a, b) => a.expectedAgeMonths - b.expectedAgeMonths)
}

export function getHealthRecords(db: AppDatabase, childId: string) {
	return db.healthRecords
		.filter((h) => h.childId === childId)
		.slice()
		.sort((a, b) => (a.date < b.date ? 1 : -1))
}
