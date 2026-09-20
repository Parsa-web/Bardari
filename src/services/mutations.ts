import type {
	Activity,
	AppDatabase,
	AppNotification,
	Birth,
	Checkup,
	CheckupStatus,
	Child,
	GrowthMeasurement,
	HealthRecord,
	Pregnancy,
	QuestionCase,
	QuestionPriority,
	QuestionStatus,
	Referral,
	ReferralStatus,
	Role,
	SubjectRef,
} from "../shared/types/domain"
import { createId } from "../shared/utils/id"
import { nowIsoTimestamp } from "../shared/utils/date"

/**
 * همه تغییرات داده به صورت تابع خالص انجام می‌شود: (db, input) => db جدید.
 * کامپوننت‌ها مستقیم با حافظه محلی کار نمی‌کنند.
 */

export type ActivityInput = {
	motherId: string
	subject: SubjectRef
	date: string
	time: string
	title: string
	category: Activity["category"]
	durationMinutes?: number | null
	severity?: number | null
	description?: string
}

export function addActivity(db: AppDatabase, input: ActivityInput): AppDatabase {
	const activity: Activity = { id: createId("ac"), createdAt: nowIsoTimestamp(), ...input }
	return { ...db, activities: [activity, ...db.activities] }
}

export function updateActivity(
	db: AppDatabase,
	id: string,
	changes: Partial<ActivityInput>,
): AppDatabase {
	return {
		...db,
		activities: db.activities.map((a) => (a.id === id ? { ...a, ...changes } : a)),
	}
}

export function deleteActivity(db: AppDatabase, id: string): AppDatabase {
	return { ...db, activities: db.activities.filter((a) => a.id !== id) }
}

export type CheckupInput = {
	motherId: string
	subject: SubjectRef
	title: string
	type: Checkup["type"]
	date: string
	time?: string
	providerName?: string
	description?: string
}

export function addCheckup(db: AppDatabase, input: CheckupInput): AppDatabase {
	const checkup: Checkup = { id: createId("cu"), status: "pending", ...input }
	return { ...db, checkups: [checkup, ...db.checkups] }
}

export function updateCheckup(
	db: AppDatabase,
	id: string,
	changes: Partial<CheckupInput>,
): AppDatabase {
	return { ...db, checkups: db.checkups.map((c) => (c.id === id ? { ...c, ...changes } : c)) }
}

export function setCheckupStatus(
	db: AppDatabase,
	id: string,
	status: CheckupStatus,
): AppDatabase {
	return { ...db, checkups: db.checkups.map((c) => (c.id === id ? { ...c, status } : c)) }
}

export function deleteCheckup(db: AppDatabase, id: string): AppDatabase {
	return { ...db, checkups: db.checkups.filter((c) => c.id !== id) }
}

export type QuestionInput = {
	motherId: string
	midwifeId?: string
	subject?: SubjectRef | null
	title: string
	text: string
	authorName: string
	/** اولویت انتخابی مادر؛ پیش‌فرض «عادی» */
	priority?: QuestionPriority
}

export function createQuestion(db: AppDatabase, input: QuestionInput): AppDatabase {
	const now = nowIsoTimestamp()
	const priority: QuestionPriority = input.priority ?? "normal"
	const question: QuestionCase = {
		id: createId("qc"),
		motherId: input.motherId,
		midwifeId: input.midwifeId,
		subject: input.subject ?? null,
		title: input.title,
		status: "open",
		priority,
		createdAt: now,
		updatedAt: now,
		messages: [
			{
				id: createId("cm"),
				authorRole: "mother",
				authorName: input.authorName,
				text: input.text,
				createdAt: now,
			},
		],
	}
	const priorityLabel = priority === "urgent" ? "فوری" : priority === "important" ? "مهم" : "عادی"
	const notified = pushNotification(db, {
		audience: "midwife",
		motherId: input.motherId,
		title: priority === "urgent" ? "سؤال فوری" : "سؤال جدید",
		body: `سؤال جدید (اولویت ${priorityLabel}): ${input.title}`,
		link: "/midwife/questions",
	})
	return { ...notified, questions: [question, ...notified.questions] }
}

export function addQuestionMessage(
	db: AppDatabase,
	questionId: string,
	message: { authorRole: Role; authorName: string; text: string },
	nextStatus?: QuestionStatus,
): AppDatabase {
	const now = nowIsoTimestamp()
	const target = db.questions.find((q) => q.id === questionId)
	const withMessage: AppDatabase = {
		...db,
		questions: db.questions.map((q) =>
			q.id === questionId
				? {
						...q,
						status: nextStatus ?? q.status,
						updatedAt: now,
						messages: [...q.messages, { id: createId("cm"), createdAt: now, ...message }],
					}
				: q,
		),
	}
	if (!target || message.authorRole === "mother") return withMessage
	return pushNotification(withMessage, {
		audience: "mother",
		motherId: target.motherId,
		title: "پاسخ جدید",
		body: `پاسخی برای سؤال «${target.title}» ثبت شد.`,
		link: "/mother/questions",
	})
}

export function setQuestionStatus(
	db: AppDatabase,
	questionId: string,
	status: QuestionStatus,
): AppDatabase {
	return {
		...db,
		questions: db.questions.map((q) =>
			q.id === questionId ? { ...q, status, updatedAt: nowIsoTimestamp() } : q,
		),
	}
}

/** تغییر اولویت سؤال (برای مادر یا ماما) */
export function setQuestionPriority(
	db: AppDatabase,
	questionId: string,
	priority: QuestionPriority,
): AppDatabase {
	return {
		...db,
		questions: db.questions.map((q) =>
			q.id === questionId ? { ...q, priority, updatedAt: nowIsoTimestamp() } : q,
		),
	}
}

export type ReferralInput = {
	motherId: string
	midwifeId: string
	specialistId: string
	subject: SubjectRef
	questionId?: string | null
	reason: string
	summary: string
	urgency: Referral["urgency"]
	createdByName: string
}

export function createReferral(db: AppDatabase, input: ReferralInput): AppDatabase {
	const now = nowIsoTimestamp()
	const referral: Referral = {
		id: createId("rf"),
		motherId: input.motherId,
		midwifeId: input.midwifeId,
		specialistId: input.specialistId,
		subject: input.subject,
		questionId: input.questionId ?? null,
		reason: input.reason,
		summary: input.summary,
		urgency: input.urgency,
		status: "sent",
		createdAt: now,
		history: [
			{ id: createId("re"), status: "created", at: now, by: input.createdByName },
			{ id: createId("re"), status: "sent", at: now, by: input.createdByName },
		],
		actions: [],
	}
	const withReferral: AppDatabase = { ...db, referrals: [referral, ...db.referrals] }
	const withQuestion = input.questionId
		? setQuestionStatus(withReferral, input.questionId, "referred")
		: withReferral
	return pushNotification(withQuestion, {
		audience: "specialist",
		motherId: input.motherId,
		title: "ارجاع جدید",
		body: `ارجاع جدید: ${input.reason}`,
		link: "/specialist/referrals",
	})
}

export function setReferralStatus(
	db: AppDatabase,
	referralId: string,
	status: ReferralStatus,
	by: string,
): AppDatabase {
	return {
		...db,
		referrals: db.referrals.map((r) =>
			r.id === referralId
				? {
						...r,
						status,
						history: [
							...r.history,
							{ id: createId("re"), status, at: nowIsoTimestamp(), by },
						],
					}
				: r,
		),
	}
}

export function addReferralAction(
	db: AppDatabase,
	referralId: string,
	action: { authorName: string; note: string },
): AppDatabase {
	const now = nowIsoTimestamp()
	const withAction: AppDatabase = {
		...db,
		referrals: db.referrals.map((r) =>
			r.id === referralId
				? {
						...r,
						status: "action_logged",
						actions: [...r.actions, { id: createId("ra"), createdAt: now, ...action }],
						history: [
							...r.history,
							{ id: createId("re"), status: "action_logged", at: now, by: action.authorName },
						],
					}
				: r,
		),
	}
	const target = db.referrals.find((r) => r.id === referralId)
	if (!target) return withAction
	return pushNotification(withAction, {
		audience: "midwife",
		motherId: target.motherId,
		title: "اقدام متخصص",
		body: `برای ارجاع «${target.reason}» اقدام ثبت شد.`,
		link: "/midwife/referrals",
	})
}

export type PregnancyInput = {
	motherId: string
	label: string
	status: Pregnancy["status"]
	lmpDate?: string | null
	eddDate?: string | null
	motherNote?: string
	providerNote?: string
}

/** فقط یک بارداری فعال مجاز است. */
export function hasActivePregnancy(db: AppDatabase, motherId: string): boolean {
	return db.pregnancies.some((p) => p.motherId === motherId && p.status === "active")
}

export function createPregnancy(db: AppDatabase, input: PregnancyInput): AppDatabase {
	if (input.status === "active" && hasActivePregnancy(db, input.motherId)) {
		throw new Error("برای هر مادر فقط یک بارداری فعال قابل ثبت است.")
	}
	const pregnancy: Pregnancy = {
		id: createId("pg"),
		createdAt: nowIsoTimestamp(),
		birth: null,
		...input,
	}
	return { ...db, pregnancies: [pregnancy, ...db.pregnancies] }
}

export function updatePregnancy(
	db: AppDatabase,
	id: string,
	changes: Partial<PregnancyInput>,
): AppDatabase {
	const target = db.pregnancies.find((p) => p.id === id)
	if (
		target &&
		changes.status === "active" &&
		target.status !== "active" &&
		hasActivePregnancy(db, target.motherId)
	) {
		throw new Error("برای هر مادر فقط یک بارداری فعال قابل ثبت است.")
	}
	return { ...db, pregnancies: db.pregnancies.map((p) => (p.id === id ? { ...p, ...changes } : p)) }
}

/** ثبت زایمان: بارداری بسته می‌شود و پرونده کودک ساخته می‌شود. */
export function recordBirth(
	db: AppDatabase,
	pregnancyId: string,
	input: { birth: Birth; childName: string; sex: Child["sex"] },
): AppDatabase {
	const pregnancy = db.pregnancies.find((p) => p.id === pregnancyId)
	if (!pregnancy) return db
	const child: Child = {
		id: createId("ch"),
		motherId: pregnancy.motherId,
		pregnancyId: pregnancy.id,
		name: input.childName,
		birthDate: input.birth.date,
		birthTime: input.birth.time,
		sex: input.sex,
	}
	return {
		...db,
		pregnancies: db.pregnancies.map((p) =>
			p.id === pregnancyId ? { ...p, status: "birthed", birth: input.birth } : p,
		),
		children: [child, ...db.children],
	}
}

export function addChild(
	db: AppDatabase,
	input: { motherId: string; name: string; birthDate: string; birthTime?: string; sex: Child["sex"]; note?: string },
): AppDatabase {
	const child: Child = { id: createId("ch"), pregnancyId: null, ...input }
	return { ...db, children: [child, ...db.children] }
}

export function addGrowthMeasurement(
	db: AppDatabase,
	input: Omit<GrowthMeasurement, "id">,
): AppDatabase {
	return { ...db, growth: [{ id: createId("gr"), ...input }, ...db.growth] }
}

export function addHealthRecord(db: AppDatabase, input: Omit<HealthRecord, "id">): AppDatabase {
	return { ...db, healthRecords: [{ id: createId("hr"), ...input }, ...db.healthRecords] }
}

export function addVaccination(
	db: AppDatabase,
	input: { childId: string; name: string; dueDate: string },
): AppDatabase {
	return { ...db, vaccinations: [{ id: createId("vc"), doneDate: null, ...input }, ...db.vaccinations] }
}

export function setVaccinationDone(
	db: AppDatabase,
	id: string,
	doneDate: string | null,
): AppDatabase {
	return { ...db, vaccinations: db.vaccinations.map((v) => (v.id === id ? { ...v, doneDate } : v)) }
}

export function setMilestoneAchieved(
	db: AppDatabase,
	id: string,
	achievedDate: string | null,
): AppDatabase {
	return { ...db, milestones: db.milestones.map((m) => (m.id === id ? { ...m, achievedDate } : m)) }
}

export function pushNotification(
	db: AppDatabase,
	input: Omit<AppNotification, "id" | "createdAt" | "read">,
): AppDatabase {
	const notification: AppNotification = {
		id: createId("nt"),
		createdAt: nowIsoTimestamp(),
		read: false,
		...input,
	}
	return { ...db, notifications: [notification, ...db.notifications] }
}

export function markNotificationRead(db: AppDatabase, id: string): AppDatabase {
	return { ...db, notifications: db.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }
}

export function markAllNotificationsRead(
	db: AppDatabase,
	audience: Role,
	motherId?: string | null,
): AppDatabase {
	return {
		...db,
		notifications: db.notifications.map((n) =>
			n.audience === audience && (audience !== "mother" || n.motherId === motherId)
				? { ...n, read: true }
				: n,
		),
	}
}
