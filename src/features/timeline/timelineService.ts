import type { AppDatabase, SubjectRef } from "../../shared/types/domain"
import {
	ACTIVITY_CATEGORY_LABELS,
	CHECKUP_STATUS_LABELS,
	REFERRAL_STATUS_LABELS,
	type Tone,
} from "../../shared/constants/labels"
import { checkupViewStatus, sameSubject } from "../../services/selectors"

export type TimelineEventType =
	| "activity"
	| "symptom"
	| "checkup"
	| "question"
	| "answer"
	| "referral"
	| "birth"
	| "vaccination"
	| "growth"
	| "milestone"
	| "health"

export type TimelineEvent = {
	id: string
	type: TimelineEventType
	date: string
	time?: string
	title: string
	description?: string
	meta?: string
	tone: Tone
	subject?: SubjectRef | null
}

export const TIMELINE_TYPE_LABELS: Record<TimelineEventType, string> = {
	activity: "فعالیت روزانه",
	symptom: "علامت",
	checkup: "چکاپ",
	question: "سؤال",
	answer: "پاسخ ماما",
	referral: "ارجاع",
	birth: "تولد",
	vaccination: "واکسیناسیون",
	growth: "اندازه‌گیری رشد",
	milestone: "مرحله رشدی",
	health: "رویداد سلامت",
}

function matches(subject: SubjectRef | null | undefined, filter?: SubjectRef | null): boolean {
	if (!filter) return true
	return sameSubject(subject, filter)
}

/**
 * ساخت Timeline یکپارچه از همه منابع داده.
 * با filter می‌توان فقط رویدادهای یک بارداری یا یک کودک را دید.
 */
export function buildTimeline(
	db: AppDatabase,
	motherId: string,
	filter?: SubjectRef | null,
): TimelineEvent[] {
	const events: TimelineEvent[] = []

	for (const activity of db.activities) {
		if (activity.motherId !== motherId || !matches(activity.subject, filter)) continue
		events.push({
			id: `ac:${activity.id}`,
			type: activity.category === "symptom" ? "symptom" : "activity",
			date: activity.date,
			time: activity.time,
			title: activity.title,
			description: activity.description,
			meta: ACTIVITY_CATEGORY_LABELS[activity.category],
			tone: activity.category === "symptom" ? "warn" : "info",
			subject: activity.subject,
		})
	}

	for (const checkup of db.checkups) {
		if (checkup.motherId !== motherId || !matches(checkup.subject, filter)) continue
		events.push({
			id: `cu:${checkup.id}`,
			type: "checkup",
			date: checkup.date,
			time: checkup.time,
			title: checkup.title,
			description: checkup.description,
			meta: CHECKUP_STATUS_LABELS[checkupViewStatus(checkup)],
			tone: "neutral",
			subject: checkup.subject,
		})
	}

	for (const question of db.questions) {
		if (question.motherId !== motherId || !matches(question.subject, filter)) continue
		events.push({
			id: `qc:${question.id}`,
			type: "question",
			date: question.createdAt.slice(0, 10),
			title: question.title,
			meta: "سؤال از ماما",
			tone: "info",
			subject: question.subject ?? null,
		})
		const lastAnswer = [...question.messages].reverse().find((m) => m.authorRole !== "mother")
		if (lastAnswer) {
			events.push({
				id: `cm:${lastAnswer.id}`,
				type: "answer",
				date: lastAnswer.createdAt.slice(0, 10),
				title: `پاسخ به: ${question.title}`,
				description: lastAnswer.text,
				meta: lastAnswer.authorName,
				tone: "success",
				subject: question.subject ?? null,
			})
		}
	}

	for (const referral of db.referrals) {
		if (referral.motherId !== motherId || !matches(referral.subject, filter)) continue
		events.push({
			id: `rf:${referral.id}`,
			type: "referral",
			date: referral.createdAt.slice(0, 10),
			title: `ارجاع: ${referral.reason}`,
			description: referral.summary,
			meta: REFERRAL_STATUS_LABELS[referral.status],
			tone: "warn",
			subject: referral.subject,
		})
	}

	for (const pregnancy of db.pregnancies) {
		if (pregnancy.motherId !== motherId || !pregnancy.birth) continue
		const child = db.children.find((c) => c.pregnancyId === pregnancy.id)
		const subject: SubjectRef = { kind: "pregnancy", id: pregnancy.id }
		const childSubject: SubjectRef | null = child ? { kind: "child", id: child.id } : null
		if (!matches(subject, filter) && !(childSubject && matches(childSubject, filter))) continue
		events.push({
			id: `bi:${pregnancy.id}`,
			type: "birth",
			date: pregnancy.birth.date,
			time: pregnancy.birth.time,
			title: child ? `تولد ${child.name}` : "ثبت تولد",
			description: pregnancy.birth.note,
			meta: pregnancy.label,
			tone: "success",
			subject,
		})
	}

	const childIds = db.children.filter((c) => c.motherId === motherId).map((c) => c.id)
	for (const childId of childIds) {
		const subject: SubjectRef = { kind: "child", id: childId }
		if (!matches(subject, filter)) continue
		for (const vaccination of db.vaccinations.filter((v) => v.childId === childId && v.doneDate)) {
			events.push({
				id: `vc:${vaccination.id}`,
				type: "vaccination",
				date: vaccination.doneDate as string,
				title: `واکسیناسیون: ${vaccination.name}`,
				meta: "انجام شد",
				tone: "success",
				subject,
			})
		}
		for (const measurement of db.growth.filter((g) => g.childId === childId)) {
			const parts: string[] = []
			if (measurement.weightKg) parts.push(`وزن ${measurement.weightKg} کیلوگرم`)
			if (measurement.heightCm) parts.push(`قد ${measurement.heightCm} سانتی‌متر`)
			if (measurement.headCm) parts.push(`دور سر ${measurement.headCm} سانتی‌متر`)
			events.push({
				id: `gr:${measurement.id}`,
				type: "growth",
				date: measurement.date,
				title: "اندازه‌گیری رشد",
				description: parts.join("، "),
				tone: "info",
				subject,
			})
		}
		for (const milestone of db.milestones.filter((m) => m.childId === childId && m.achievedDate)) {
			events.push({
				id: `ms:${milestone.id}`,
				type: "milestone",
				date: milestone.achievedDate as string,
				title: milestone.title,
				description: milestone.note,
				meta: "مرحله رشدی ثبت‌شده",
				tone: "success",
				subject,
			})
		}
		for (const record of db.healthRecords.filter((h) => h.childId === childId)) {
			events.push({
				id: `hr:${record.id}`,
				type: "health",
				date: record.date,
				title: record.title,
				description: record.description,
				tone: "neutral",
				subject,
			})
		}
	}

	return events.sort((a, b) => {
		if (a.date !== b.date) return a.date < b.date ? 1 : -1
		return (b.time ?? "") < (a.time ?? "") ? -1 : 1
	})
}
