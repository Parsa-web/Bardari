import type { QuestionCase, QuestionPriority } from "../shared/types/domain"

/**
 * منطق اولویت سؤال‌ها در لایه سرویس نگهداری می‌شود؛ کامپوننت‌ها فقط آن را صدا می‌زنند.
 * ترتیب ثابت: فوری ← مهم ← عادی
 */
export const QUESTION_PRIORITY_ORDER: QuestionPriority[] = ["urgent", "important", "normal"]

/** سؤال‌های قدیمی اولویت ندارند؛ پیش‌فرض «عادی» در نظر گرفته می‌شود. */
export function questionPriority(question: QuestionCase): QuestionPriority {
	return question.priority ?? "normal"
}

export function questionPriorityRank(question: QuestionCase): number {
	const index = QUESTION_PRIORITY_ORDER.indexOf(questionPriority(question))
	return index === -1 ? QUESTION_PRIORITY_ORDER.length : index
}

/** مرتب‌سازی اول براساس اولویت، سپس براساس معیار دوم (مثلاً تازگی گفتگو). */
export function sortQuestionsByPriority<T extends QuestionCase>(
	list: T[],
	tiebreak: (a: T, b: T) => number,
): T[] {
	return [...list].sort((a, b) => {
		const diff = questionPriorityRank(a) - questionPriorityRank(b)
		return diff !== 0 ? diff : tiebreak(a, b)
	})
}
