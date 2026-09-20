/**
 * مدل دامنه سامانه مراقبت مادر و کودک.
 * اصل کلیدی: Mother ≠ Pregnancy ≠ Child ; هر سه موجودیت مستقل هستند و با شناسه به هم وصل می‌شوند.
 */

export type Role = "mother" | "midwife" | "specialist"

export type SubjectKind = "mother" | "pregnancy" | "child"

/** ارجاع عمومی به موضوع یک رکورد: خود مادر، یک بارداری مشخص، یا یک کودک مشخص */
export type SubjectRef = { kind: SubjectKind; id: string }

export type CareProvider = {
	id: string
	role: "midwife" | "specialist"
	name: string
	specialty?: string
	center?: string
}

/** وضعیت جاری اعلام‌شده توسط خود مادر در زمان ثبت‌نام */
export type MotherCurrentStatus = "planning" | "pregnant" | "postpartum" | "not_pregnant"

export type Mother = {
	id: string
	firstName: string
	lastName: string
	phone?: string
	birthDate?: string | null
	bloodType?: string
	city?: string
	careTeam: { midwifeId?: string; specialistIds: string[] }
	note?: string
	/** وضعیت اعلامی مادر؛ جایگزین موجودیت بارداری نیست */
	currentStatus?: MotherCurrentStatus
	createdAt?: string
}

export type PregnancyStatus = "planning" | "active" | "birthed" | "ended"

export type Birth = {
	date: string
	time?: string
	kind?: "natural" | "cesarean" | "unknown"
	place?: string
	note?: string
}

export type Pregnancy = {
	id: string
	motherId: string
	label: string
	status: PregnancyStatus
	/** اولین روز آخرین قاعدگی (LMP) */
	lmpDate?: string | null
	/** تاریخ تخمینی زایمان */
	eddDate?: string | null
	createdAt: string
	/** یادداشت ثبت‌شده توسط مادر */
	motherNote?: string
	/** یادداشت ثبت‌شده توسط ماما یا متخصص */
	providerNote?: string
	birth?: Birth | null
}

export type Child = {
	id: string
	motherId: string
	/** بارداری مرتبط، اگر تولد در سامانه ثبت شده باشد */
	pregnancyId?: string | null
	name: string
	birthDate: string
	birthTime?: string
	sex: "female" | "male" | "unknown"
	note?: string
}

/**
 * حساب ورود نمایشی.
 * رمز به‌صورت متن ساده نگهداری نمی‌شود؛ فقط یک اثر تک‌طرفه ساده برای دمو ذخیره می‌شود
 * و این جایگزین احراز هویت واقعی سمت سرور نیست.
 */
export type AuthAccount = {
	id: string
	role: Role
	phone: string
	passwordHash: string
	displayName: string
	motherId?: string | null
	providerId?: string | null
	createdAt: string
}

/**
 * دسته فعالیت.
 * چهار دسته رسمی: sleep (خواب)، food (تغذیه)، movement (ورزش)، note (سایر).
 * symptom و medication فقط برای سازگاری با رکوردهای قدیمی باقی مانده‌اند و قابل انتخاب نیستند.
 */
export type ActivityCategory =
	| "food"
	| "movement"
	| "symptom"
	| "medication"
	| "sleep"
	| "note"

export type Activity = {
	id: string
	motherId: string
	subject: SubjectRef
	date: string
	time: string
	title: string
	category: ActivityCategory
	/** مخصوص دسته «فعالیت» و «خواب» */
	durationMinutes?: number | null
	/** مخصوص رکوردهای قدیمی علائم: شدت ۱ تا ۵ */
	severity?: number | null
	description?: string
	createdAt: string
}

/** وضعیت ذخیره‌شده چکاپ */
export type CheckupStatus = "pending" | "done" | "missed" | "canceled"
/** وضعیت نمایشی چکاپ (نزدیک موعد و عقب‌افتاده از تاریخ محاسبه می‌شوند) */
export type CheckupViewStatus = CheckupStatus | "due_soon" | "overdue"

export type CheckupType =
	| "prenatal"
	| "lab"
	| "ultrasound"
	| "child"
	| "vaccination"
	| "other"

export type Checkup = {
	id: string
	motherId: string
	subject: SubjectRef
	title: string
	type: CheckupType
	date: string
	time?: string
	status: CheckupStatus
	providerName?: string
	description?: string
}

export type QuestionStatus =
	| "open"
	| "in_review"
	| "answered"
	| "needs_followup"
	| "referred"
	| "closed"

/** اولویت سؤال که مادر هنگام ثبت انتخاب می‌کند */
export type QuestionPriority = "urgent" | "important" | "normal"

export type CaseMessage = {
	id: string
	authorRole: Role
	authorName: string
	text: string
	createdAt: string
}

/** هر سؤال یک پرونده گفتگوی مستقل است */
export type QuestionCase = {
	id: string
	motherId: string
	midwifeId?: string
	subject?: SubjectRef | null
	title: string
	status: QuestionStatus
	/** سؤال‌های قدیمی ممکن است اولویت نداشته باشند؛ پیش‌فرض «عادی» است */
	priority?: QuestionPriority
	createdAt: string
	updatedAt: string
	messages: CaseMessage[]
}

export type ReferralStatus =
	| "created"
	| "sent"
	| "seen"
	| "in_review"
	| "action_logged"
	| "closed"

export type Urgency = "low" | "normal" | "high"

export type ReferralAction = {
	id: string
	authorName: string
	note: string
	createdAt: string
}

export type ReferralEvent = {
	id: string
	status: ReferralStatus
	at: string
	by: string
}

export type Referral = {
	id: string
	motherId: string
	midwifeId: string
	specialistId: string
	subject: SubjectRef
	questionId?: string | null
	reason: string
	summary: string
	urgency: Urgency
	status: ReferralStatus
	createdAt: string
	history: ReferralEvent[]
	actions: ReferralAction[]
}

export type Vaccination = {
	id: string
	childId: string
	name: string
	dueDate: string
	doneDate?: string | null
}

export type GrowthMeasurement = {
	id: string
	childId: string
	date: string
	weightKg?: number | null
	heightCm?: number | null
	headCm?: number | null
}

export type Milestone = {
	id: string
	childId: string
	title: string
	expectedAgeMonths: number
	achievedDate?: string | null
	note?: string
}

export type HealthRecordKind = "illness" | "medication" | "note" | "lab"

export type HealthRecord = {
	id: string
	childId: string
	date: string
	title: string
	kind: HealthRecordKind
	description?: string
}

export type AppNotification = {
	id: string
	audience: Role
	/** اگر اعلان مربوط به یک مادر خاص است */
	motherId?: string
	title: string
	body: string
	createdAt: string
	read: boolean
	/** مسیر داخلی برای «مشاهده جزئیات» */
	link?: string
}

export type AppDatabase = {
	version: number
	providers: CareProvider[]
	mothers: Mother[]
	accounts: AuthAccount[]
	pregnancies: Pregnancy[]
	children: Child[]
	activities: Activity[]
	checkups: Checkup[]
	questions: QuestionCase[]
	referrals: Referral[]
	vaccinations: Vaccination[]
	growth: GrowthMeasurement[]
	milestones: Milestone[]
	healthRecords: HealthRecord[]
	notifications: AppNotification[]
}
