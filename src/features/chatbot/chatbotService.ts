/**
 * دستیار اختصاصی حوزه بارداری و مراقبت مادر و کودک.
 * این پیاده‌سازی Mock است و هیچ مدل هوش مصنوعی واقعی پشت آن نیست.
 * مسیر پردازش: سؤال ← بررسی حوزه ← بررسی ایمنی ← پاسخ
 */

export type ChatbotReplyKind = "answer" | "out_of_domain" | "safety" | "unknown"

export type ChatbotReply = {
	kind: ChatbotReplyKind
	text: string
	/** پیشنهاد ادامه گفتگو */
	suggestions?: string[]
}

export interface ChatbotService {
	ask(question: string): Promise<ChatbotReply>
}

export const OUT_OF_DOMAIN_MESSAGE =
	"این دستیار فقط برای پرسش‌های مرتبط با بارداری و مراقبت مادر و کودک طراحی شده است."

export const SAFETY_MESSAGE =
	"نشانه‌ای که نوشتید می‌تواند فوری باشد. لطفاً بی‌درنگ با ماما یا پزشک خود تماس بگیرید یا به اورژانس مراجعه کنید. من جایگزین مراقب سلامت نیستم و تشخیص پزشکی نمی‌دهم."

export const UNKNOWN_MESSAGE =
	"برای این پرسش پاسخ آماده‌ای ندارم. می‌توانید همین سؤال را از بخش «سؤال از ماما» بپرسید تا مراقب سلامت شما پاسخ دهد."

export const CHATBOT_DISCLAIMER =
	"این دستیار اطلاعات عمومی مراقبتی می‌دهد، تشخیص پزشکی نمی‌دهد و جایگزین ماما یا پزشک نیست."

export const CHATBOT_SUGGESTIONS = [
	"تغذیه مناسب در دوران بارداری چطور باشد؟",
	"در دوران بارداری چه ورزشی مناسب است؟",
	"برنامه واکسیناسیون کودک چگونه پیگیری می‌شود؟",
	"برای خواب نوزاد چه نکاتی را رعایت کنم؟",
]

const DOMAIN_KEYWORDS = [
	"باردار",
	"بارداری",
	"جنین",
	"زایمان",
	"نوزاد",
	"کودک",
	"نوپا",
	"شیردهی",
	"شیر مادر",
	"ماما",
	"مراقبت",
	"چکاپ",
	"واکسن",
	"واکسیناسیون",
	"تغذیه",
	"ورزش",
	"خواب",
	"رشد",
	"وزن",
	"تهوع",
	"ویار",
	"سونوگرافی",
	"آزمایش",
	"مکمل",
	"اسید فولیک",
	"آهن",
	"دندان",
	"تب",
	"شیر خشک",
	"هفته بارداری",
]

const SAFETY_KEYWORDS = [
	"خونریزی",
	"خون‌ریزی",
	"درد شدید",
	"تشنج",
	"بی‌هوش",
	"تنگی نفس",
	"تب بالا",
	"سقط",
	"نبود حرکت جنین",
	"حرکت جنین را حس نمی‌کنم",
	"آب ریزش",
	"تاری دید",
	"فشار خون بالا",
]

type Topic = { keywords: string[]; answer: string }

const TOPICS: Topic[] = [
	{
		keywords: ["تغذیه", "غذا", "رژیم", "بخورم"],
		answer:
			"در دوران بارداری معمولاً بر تنوع غذایی، منابع پروتئینی، سبزیجات، لبنیات و مایعات کافی تأکید می‌شود. مقدار دقیق و مکمل‌ها باید توسط ماما یا پزشک شما تعیین شود.",
	},
	{
		keywords: ["ورزش", "پیاده‌روی", "پیاده روی", "شنا", "حرکت ورزشی"],
		answer:
			"فعالیت سبک مانند پیاده‌روی منظم در بسیاری از بارداری‌های کم‌خطر توصیه می‌شود، اما شدت و نوع آن به وضعیت شما بستگی دارد. پیش از شروع یا ادامه ورزش، با مامای خود مطرح کنید.",
	},
	{
		keywords: ["واکسن", "واکسیناسیون", "ایمن‌سازی"],
		answer:
			"نوبت‌های واکسیناسیون کودک در بخش «کودکان» پنل قابل مشاهده و پیگیری است. برنامه رسمی واکسیناسیون را مرکز سلامت شما تعیین می‌کند.",
	},
	{
		keywords: ["خواب", "بیدار", "بی‌قرار"],
		answer:
			"برای خواب نوزاد معمولاً بر خواباندن به پشت، سطح خواب صاف و محیط آرام تأکید می‌شود. اگر بی‌قراری ادامه‌دار است، این مورد را در بخش سؤال از ماما ثبت کنید.",
	},
	{
		keywords: ["تهوع", "ویار", "سرگیجه"],
		answer:
			"تهوع در ماه‌های اول شایع است. وعده‌های کوچک و مکرر و مایعات کافی ممکن است کمک کند. اگر شدید است یا مانع خوردن و آشامیدن می‌شود، حتماً با ماما یا پزشک خود تماس بگیرید.",
	},
	{
		keywords: ["چکاپ", "مراقبت", "نوبت", "آزمایش", "سونوگرافی"],
		answer:
			"برنامه چکاپ‌ها و آزمایش‌های ثبت‌شده شما در بخش «چکاپ‌ها» قابل مشاهده است و موارد نزدیک موعد یا عقب‌افتاده در مرکز اعلان‌ها نمایش داده می‌شوند.",
	},
	{
		keywords: ["هفته بارداری", "چند هفته", "سن بارداری"],
		answer:
			"هفته بارداری از روی تاریخ اولین روز آخرین قاعدگی یا تاریخ تخمینی زایمان محاسبه می‌شود. اگر این تاریخ‌ها در پرونده ثبت نشده باشد، سامانه عدد ساختگی نمایش نمی‌دهد.",
	},
	{
		keywords: ["شیردهی", "شیر مادر", "شیر خشک"],
		answer:
			"در ماه‌های اول، شیردهی بر حسب تقاضای کودک توصیه می‌شود. اگر درباره کفایت شیر یا وزن‌گیری کودک نگرانید، اندازه‌گیری رشد را ثبت کنید و با ماما در میان بگذارید.",
	},
]

function includesAny(text: string, keywords: string[]): boolean {
	return keywords.some((keyword) => text.includes(keyword))
}

/** مرحله ۱: بررسی حوزه */
export function isInDomain(question: string): boolean {
	return includesAny(question, DOMAIN_KEYWORDS) || includesAny(question, SAFETY_KEYWORDS)
}

/** مرحله ۲: بررسی ایمنی */
export function needsHumanCare(question: string): boolean {
	return includesAny(question, SAFETY_KEYWORDS)
}

export class MockChatbotService implements ChatbotService {
	async ask(question: string): Promise<ChatbotReply> {
		const text = question.trim()
		if (!text) {
			return { kind: "unknown", text: UNKNOWN_MESSAGE, suggestions: CHATBOT_SUGGESTIONS }
		}
		if (!isInDomain(text)) {
			return { kind: "out_of_domain", text: OUT_OF_DOMAIN_MESSAGE, suggestions: CHATBOT_SUGGESTIONS }
		}
		if (needsHumanCare(text)) {
			return { kind: "safety", text: SAFETY_MESSAGE }
		}
		const topic = TOPICS.find((item) => includesAny(text, item.keywords))
		if (!topic) {
			return { kind: "unknown", text: UNKNOWN_MESSAGE, suggestions: CHATBOT_SUGGESTIONS }
		}
		return { kind: "answer", text: topic.answer }
	}
}

export const chatbotService: ChatbotService = new MockChatbotService()
