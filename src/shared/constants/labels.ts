import type {
	ActivityCategory,
	CheckupType,
	CheckupViewStatus,
	HealthRecordKind,
	MotherCurrentStatus,
	PregnancyStatus,
	QuestionStatus,
	ReferralStatus,
	Role,
	SubjectKind,
	Urgency,
} from "../types/domain"

export type Tone = "neutral" | "info" | "success" | "warn" | "danger"

export const ROLE_LABELS: Record<Role, string> = {
	mother: "مادر",
	midwife: "ماما",
	specialist: "متخصص",
}

export const MOTHER_STATUS_LABELS: Record<MotherCurrentStatus, string> = {
	planning: "قصد بارداری دارم",
	pregnant: "باردار هستم",
	postpartum: "در حال پیگیری پس از زایمان",
	not_pregnant: "فعلاً باردار نیستم",
}

export const MOTHER_STATUS_TONES: Record<MotherCurrentStatus, Tone> = {
	planning: "info",
	pregnant: "success",
	postpartum: "info",
	not_pregnant: "neutral",
}

export const SUBJECT_KIND_LABELS: Record<SubjectKind, string> = {
	mother: "مادر",
	pregnancy: "بارداری",
	child: "کودک",
}

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategory, string> = {
	food: "غذا",
	movement: "فعالیت",
	symptom: "علائم",
	medication: "دارو",
	sleep: "خواب",
	note: "یادداشت",
}

export const PREGNANCY_STATUS_LABELS: Record<PregnancyStatus, string> = {
	planning: "پیش از بارداری",
	active: "بارداری فعال",
	birthed: "زایمان ثبت شده",
	ended: "پایان‌یافته",
}

export const PREGNANCY_STATUS_TONES: Record<PregnancyStatus, Tone> = {
	planning: "info",
	active: "success",
	birthed: "neutral",
	ended: "neutral",
}

export const CHECKUP_TYPE_LABELS: Record<CheckupType, string> = {
	prenatal: "مراقبت بارداری",
	lab: "آزمایش",
	ultrasound: "سونوگرافی",
	child: "چکاپ کودک",
	vaccination: "واکسیناسیون",
	other: "سایر",
}

export const CHECKUP_STATUS_LABELS: Record<CheckupViewStatus, string> = {
	pending: "در انتظار",
	due_soon: "نزدیک موعد",
	overdue: "عقب‌افتاده",
	done: "انجام شد",
	missed: "انجام نشد",
	canceled: "لغو شد",
}

export const CHECKUP_STATUS_TONES: Record<CheckupViewStatus, Tone> = {
	pending: "neutral",
	due_soon: "warn",
	overdue: "danger",
	done: "success",
	missed: "danger",
	canceled: "neutral",
}

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
	open: "باز",
	in_review: "در حال بررسی",
	answered: "پاسخ داده شد",
	needs_followup: "نیازمند پیگیری",
	referred: "ارجاع به متخصص",
	closed: "بسته شد",
}

export const QUESTION_STATUS_TONES: Record<QuestionStatus, Tone> = {
	open: "warn",
	in_review: "info",
	answered: "success",
	needs_followup: "warn",
	referred: "info",
	closed: "neutral",
}

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
	created: "ایجاد شد",
	sent: "ارسال شد",
	seen: "مشاهده شد",
	in_review: "در حال بررسی",
	action_logged: "اقدام ثبت شد",
	closed: "بسته شد",
}

export const REFERRAL_STATUS_TONES: Record<ReferralStatus, Tone> = {
	created: "neutral",
	sent: "info",
	seen: "info",
	in_review: "warn",
	action_logged: "success",
	closed: "neutral",
}

/** ترتیب چرخه عمر ارجاع، برای حرکت مرحله‌به‌مرحله */
export const REFERRAL_FLOW: ReferralStatus[] = [
	"created",
	"sent",
	"seen",
	"in_review",
	"action_logged",
	"closed",
]

export const URGENCY_LABELS: Record<Urgency, string> = {
	low: "کم",
	normal: "معمولی",
	high: "فوری",
}

export const URGENCY_TONES: Record<Urgency, Tone> = {
	low: "neutral",
	normal: "info",
	high: "danger",
}

export const SEX_LABELS: Record<"female" | "male" | "unknown", string> = {
	female: "دختر",
	male: "پسر",
	unknown: "ثبت نشده",
}

export const BIRTH_KIND_LABELS: Record<"natural" | "cesarean" | "unknown", string> = {
	natural: "زایمان طبیعی",
	cesarean: "سزارین",
	unknown: "ثبت نشده",
}

export const HEALTH_RECORD_KIND_LABELS: Record<HealthRecordKind, string> = {
	illness: "بیماری",
	medication: "دارو",
	note: "یادداشت",
	lab: "آزمایش",
}

export const NOT_RECORDED = "اطلاعات ثبت نشده"
