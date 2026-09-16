import type { AppDatabase } from "../../shared/types/domain"
import { addDays, todayIso } from "../../shared/utils/date"
import { hashSecret } from "../auth/authService"

export const SCHEMA_VERSION = 2

/** رمز همه حساب‌های نمایشی؛ فقط برای دمو و بدون هیچ ارزش امنیتی. */
export const DEMO_PASSWORD = "123456"

const DEMO_HASH = hashSecret(DEMO_PASSWORD)

const d = (offset: number) => addDays(todayIso(), offset)
const ts = (offset: number, time = "10:00") => `${d(offset)}T${time}:00.000Z`

/** داده نمایشی ساختگی؛ هیچ اطلاع واقعی یا قابل شناسایی در آن نیست. */
export function createSeedDatabase(): AppDatabase {
	return {
		version: SCHEMA_VERSION,
		providers: [
			{ id: "mw_1", role: "midwife", name: "مریم رضایی", specialty: "مامایی", center: "مرکز سلامت شماره ۲" },
			{ id: "sp_1", role: "specialist", name: "دکتر نسرین کاویانی", specialty: "زنان و زایمان", center: "کلینیک تخصصی مرکزی" },
			{ id: "sp_2", role: "specialist", name: "دکتر امید صالحی", specialty: "نوزادان و کودکان", center: "درمانگاه کودکان" },
		],
		mothers: [
			{ id: "mo_1", firstName: "زهرا", lastName: "موسوی", phone: "09120000001", birthDate: "1996-04-12", bloodType: "O+", city: "تهران", careTeam: { midwifeId: "mw_1", specialistIds: ["sp_1"] }, note: "بارداری دوم؛ یک فرزند از بارداری قبلی.", currentStatus: "pregnant", createdAt: ts(-300) },
			{ id: "mo_2", firstName: "نرگس", lastName: "کریمی", phone: "09120000002", birthDate: "2000-09-03", bloodType: "A+", city: "کرج", careTeam: { midwifeId: "mw_1", specialistIds: [] }, note: "مرحله پیش از بارداری؛ تاریخ‌ها ثبت نشده.", currentStatus: "planning", createdAt: ts(-120) },
			{ id: "mo_3", firstName: "فاطمه", lastName: "حیدری", phone: "09120000003", birthDate: "1992-01-20", bloodType: "B-", city: "اصفهان", careTeam: { midwifeId: "mw_1", specialistIds: ["sp_1"] }, note: "نیازمند پیگیری در سه‌ماهه سوم.", currentStatus: "pregnant", createdAt: ts(-260) },
			{ id: "mo_4", firstName: "سمیرا", lastName: "عباسی", phone: "09120000004", birthDate: "1990-11-08", city: "شیراز", careTeam: { midwifeId: "mw_1", specialistIds: ["sp_2"] }, note: "دو فرزند؛ بدون بارداری فعال.", currentStatus: "postpartum", createdAt: ts(-400) },
			{ id: "mo_5", firstName: "الهام", lastName: "نوری", phone: "09120000005", birthDate: null, city: "تبریز", careTeam: { midwifeId: "mw_1", specialistIds: [] }, note: "پرونده خالی برای بررسی حالت بدون داده.", currentStatus: "not_pregnant", createdAt: ts(-20) },
		],
		accounts: [
			{ id: "au_1", role: "mother", phone: "09120000001", passwordHash: DEMO_HASH, displayName: "زهرا موسوی", motherId: "mo_1", providerId: null, createdAt: ts(-300) },
			{ id: "au_2", role: "mother", phone: "09120000002", passwordHash: DEMO_HASH, displayName: "نرگس کریمی", motherId: "mo_2", providerId: null, createdAt: ts(-120) },
			{ id: "au_3", role: "mother", phone: "09120000003", passwordHash: DEMO_HASH, displayName: "فاطمه حیدری", motherId: "mo_3", providerId: null, createdAt: ts(-260) },
			{ id: "au_4", role: "mother", phone: "09120000004", passwordHash: DEMO_HASH, displayName: "سمیرا عباسی", motherId: "mo_4", providerId: null, createdAt: ts(-400) },
			{ id: "au_5", role: "mother", phone: "09120000005", passwordHash: DEMO_HASH, displayName: "الهام نوری", motherId: "mo_5", providerId: null, createdAt: ts(-20) },
			{ id: "au_6", role: "midwife", phone: "09130000001", passwordHash: DEMO_HASH, displayName: "مریم رضایی", motherId: null, providerId: "mw_1", createdAt: ts(-400) },
			{ id: "au_7", role: "specialist", phone: "09130000002", passwordHash: DEMO_HASH, displayName: "دکتر نسرین کاویانی", motherId: null, providerId: "sp_1", createdAt: ts(-400) },
			{ id: "au_8", role: "specialist", phone: "09130000003", passwordHash: DEMO_HASH, displayName: "دکتر امید صالحی", motherId: null, providerId: "sp_2", createdAt: ts(-400) },
		],
		pregnancies: [
			{ id: "pg_1", motherId: "mo_1", label: "بارداری اول", status: "birthed", lmpDate: d(-1185), eddDate: d(-905), createdAt: ts(-1185), providerNote: "زایمان طبیعی بدون عارضه ثبت شد.", birth: { date: d(-905), time: "04:20", kind: "natural", place: "بیمارستان مرکزی" } },
			{ id: "pg_2", motherId: "mo_1", label: "بارداری دوم", status: "active", lmpDate: d(-147), eddDate: null, createdAt: ts(-140), motherNote: "تهوع ماه‌های اول کمتر شده است.", providerNote: "فشار خون در محدوده طبیعی ثبت شد.", birth: null },
			{ id: "pg_3", motherId: "mo_2", label: "پرونده پیش از بارداری", status: "planning", lmpDate: null, eddDate: null, createdAt: ts(-30), motherNote: "در مرحله آمادگی و مشاوره هستم.", birth: null },
			{ id: "pg_4", motherId: "mo_3", label: "بارداری جاری", status: "active", lmpDate: d(-238), eddDate: d(42), createdAt: ts(-230), motherNote: "چند روز است ورم پاها بیشتر شده.", providerNote: "نیاز به پیگیری هفتگی.", birth: null },
		],
		children: [
			{ id: "ch_1", motherId: "mo_1", pregnancyId: "pg_1", name: "آریا", birthDate: d(-905), birthTime: "04:20", sex: "male", note: "روند رشد ثبت شده است." },
			{ id: "ch_2", motherId: "mo_4", pregnancyId: null, name: "نیکی", birthDate: d(-1520), sex: "female" },
			{ id: "ch_3", motherId: "mo_4", pregnancyId: null, name: "مانی", birthDate: d(-252), birthTime: "21:05", sex: "male" },
		],
		activities: [
			{ id: "ac_1", motherId: "mo_1", subject: { kind: "pregnancy", id: "pg_2" }, date: d(0), time: "08:30", title: "صبحانه", category: "food", description: "نان، پنیر و گردو با یک لیوان شیر.", createdAt: ts(0, "08:35") },
			{ id: "ac_2", motherId: "mo_1", subject: { kind: "pregnancy", id: "pg_2" }, date: d(0), time: "10:15", title: "پیاده‌روی", category: "movement", durationMinutes: 20, description: "حال عمومی خوب بود.", createdAt: ts(0, "10:40") },
			{ id: "ac_3", motherId: "mo_1", subject: { kind: "pregnancy", id: "pg_2" }, date: d(0), time: "18:20", title: "کمردرد خفیف", category: "symptom", severity: 2, description: "بعد از ایستادن طولانی شروع شد.", createdAt: ts(0, "18:25") },
			{ id: "ac_4", motherId: "mo_1", subject: { kind: "pregnancy", id: "pg_2" }, date: d(-1), time: "09:00", title: "مصرف مکمل آهن", category: "medication", description: "طبق دستور ماما.", createdAt: ts(-1, "09:05") },
			{ id: "ac_5", motherId: "mo_1", subject: { kind: "child", id: "ch_1" }, date: d(-2), time: "17:00", title: "بازی در پارک", category: "movement", durationMinutes: 45, createdAt: ts(-2, "18:00") },
			{ id: "ac_6", motherId: "mo_3", subject: { kind: "pregnancy", id: "pg_4" }, date: d(0), time: "07:45", title: "ورم پاها", category: "symptom", severity: 3, description: "صبح بیشتر از شب قبل بود.", createdAt: ts(0, "07:50") },
			{ id: "ac_7", motherId: "mo_4", subject: { kind: "child", id: "ch_3" }, date: d(0), time: "11:00", title: "شیردهی", category: "food", durationMinutes: 15, createdAt: ts(0, "11:05") },
		],
		checkups: [
			{ id: "cu_1", motherId: "mo_1", subject: { kind: "pregnancy", id: "pg_2" }, title: "مراقبت روتین بارداری", type: "prenatal", date: d(2), time: "09:30", status: "pending", providerName: "مریم رضایی", description: "همراه داشتن دفترچه مراقبت." },
			{ id: "cu_2", motherId: "mo_1", subject: { kind: "pregnancy", id: "pg_2" }, title: "سونوگرافی غربالگری", type: "ultrasound", date: d(-14), time: "11:00", status: "done", providerName: "دکتر نسرین کاویانی" },
			{ id: "cu_3", motherId: "mo_1", subject: { kind: "pregnancy", id: "pg_2" }, title: "آزمایش خون دوره‌ای", type: "lab", date: d(-3), time: "08:00", status: "pending", providerName: "آزمایشگاه مرکز سلامت", description: "ناشتا مراجعه شود." },
			{ id: "cu_4", motherId: "mo_1", subject: { kind: "child", id: "ch_1" }, title: "چکاپ دوره‌ای کودک", type: "child", date: d(-40), status: "done", providerName: "دکتر امید صالحی" },
			{ id: "cu_5", motherId: "mo_1", subject: { kind: "pregnancy", id: "pg_2" }, title: "جلسه آموزش تغذیه", type: "other", date: d(-9), status: "canceled", description: "به درخواست مرکز لغو شد." },
			{ id: "cu_6", motherId: "mo_3", subject: { kind: "pregnancy", id: "pg_4" }, title: "مراقبت سه‌ماهه سوم", type: "prenatal", date: d(1), time: "12:00", status: "pending", providerName: "مریم رضایی" },
			{ id: "cu_7", motherId: "mo_3", subject: { kind: "pregnancy", id: "pg_4" }, title: "آزمایش قند خون", type: "lab", date: d(-10), status: "missed", description: "مادر مراجعه نکرده است." },
			{ id: "cu_8", motherId: "mo_4", subject: { kind: "child", id: "ch_3" }, title: "واکسن ۸ ماهگی", type: "vaccination", date: d(5), time: "09:00", status: "pending", providerName: "مرکز سلامت شماره ۲" },
		],
		questions: [
			{ id: "qc_1", motherId: "mo_1", midwifeId: "mw_1", subject: { kind: "pregnancy", id: "pg_2" }, title: "تغذیه مناسب در سه‌ماهه دوم", status: "answered", createdAt: ts(-6, "09:10"), updatedAt: ts(-5, "12:00"), messages: [
				{ id: "cm_1", authorRole: "mother", authorName: "زهرا موسوی", text: "در این هفته‌ها چه موادی را بهتر است بیشتر مصرف کنم؟", createdAt: ts(-6, "09:10") },
				{ id: "cm_2", authorRole: "midwife", authorName: "مریم رضایی", text: "تنوع غذایی، منابع پروتئینی و مایعات کافی را در برنامه روزانه داشته باشید. جزئیات را در جلسه مراقبت بعدی مرور می‌کنیم.", createdAt: ts(-5, "11:40") },
				{ id: "cm_3", authorRole: "mother", authorName: "زهرا موسوی", text: "ممنون، یادداشت کردم.", createdAt: ts(-5, "12:00") },
			] },
			{ id: "qc_2", motherId: "mo_3", midwifeId: "mw_1", subject: { kind: "pregnancy", id: "pg_4" }, title: "ورم پاها در هفته‌های آخر", status: "open", createdAt: ts(0, "08:05"), updatedAt: ts(0, "08:05"), messages: [
				{ id: "cm_4", authorRole: "mother", authorName: "فاطمه حیدری", text: "چند روز است ورم پاهایم بیشتر شده است. چه کار کنم؟", createdAt: ts(0, "08:05") },
			] },
			{ id: "qc_3", motherId: "mo_4", midwifeId: "mw_1", subject: { kind: "child", id: "ch_3" }, title: "بی‌قراری شبانه کودک ۸ ماهه", status: "referred", createdAt: ts(-4, "21:30"), updatedAt: ts(-2, "10:00"), messages: [
				{ id: "cm_5", authorRole: "mother", authorName: "سمیرا عباسی", text: "شب‌ها چند بار بیدار می‌شود و بی‌قرار است.", createdAt: ts(-4, "21:30") },
				{ id: "cm_6", authorRole: "midwife", authorName: "مریم رضایی", text: "برای بررسی دقیق‌تر پرونده را به متخصص کودکان ارجاع دادم.", createdAt: ts(-2, "10:00") },
			] },
			{ id: "qc_4", motherId: "mo_1", midwifeId: "mw_1", subject: { kind: "pregnancy", id: "pg_2" }, title: "ورزش مناسب در دوران بارداری", status: "needs_followup", createdAt: ts(-2, "16:00"), updatedAt: ts(-1, "09:00"), messages: [
				{ id: "cm_7", authorRole: "mother", authorName: "زهرا موسوی", text: "می‌توانم شنا را ادامه دهم؟", createdAt: ts(-2, "16:00") },
				{ id: "cm_8", authorRole: "midwife", authorName: "مریم رضایی", text: "در جلسه مراقبت بعدی با توجه به معاینه تصمیم می‌گیریم؛ لطفاً یادآوری کنید.", createdAt: ts(-1, "09:00") },
			] },
		],
		referrals: [
			{ id: "rf_1", motherId: "mo_3", midwifeId: "mw_1", specialistId: "sp_1", subject: { kind: "pregnancy", id: "pg_4" }, questionId: "qc_2", reason: "ورم فزاینده در سه‌ماهه سوم", summary: "مادر در هفته‌های انتهایی بارداری است؛ ورم پاها بیشتر شده و آزمایش دوره‌ای انجام نشده است.", urgency: "high", status: "sent", createdAt: ts(0, "09:00"), history: [
				{ id: "re_1", status: "created", at: ts(0, "09:00"), by: "مریم رضایی" },
				{ id: "re_2", status: "sent", at: ts(0, "09:05"), by: "مریم رضایی" },
			], actions: [] },
			{ id: "rf_2", motherId: "mo_4", midwifeId: "mw_1", specialistId: "sp_2", subject: { kind: "child", id: "ch_3" }, questionId: "qc_3", reason: "بی‌قراری شبانه کودک", summary: "کودک ۸ ماهه با بیداری‌های مکرر شبانه؛ اندازه‌گیری‌های رشد ثبت شده است.", urgency: "normal", status: "in_review", createdAt: ts(-2, "10:05"), history: [
				{ id: "re_3", status: "created", at: ts(-2, "10:05"), by: "مریم رضایی" },
				{ id: "re_4", status: "sent", at: ts(-2, "10:10"), by: "مریم رضایی" },
				{ id: "re_5", status: "seen", at: ts(-1, "08:30"), by: "دکتر امید صالحی" },
				{ id: "re_6", status: "in_review", at: ts(-1, "08:40"), by: "دکتر امید صالحی" },
			], actions: [] },
			{ id: "rf_3", motherId: "mo_1", midwifeId: "mw_1", specialistId: "sp_1", subject: { kind: "pregnancy", id: "pg_2" }, questionId: null, reason: "مرور نتیجه سونوگرافی", summary: "نتیجه سونوگرافی غربالگری برای مرور تخصصی ارسال شد.", urgency: "low", status: "closed", createdAt: ts(-13, "11:00"), history: [
				{ id: "re_7", status: "created", at: ts(-13, "11:00"), by: "مریم رضایی" },
				{ id: "re_8", status: "sent", at: ts(-13, "11:05"), by: "مریم رضایی" },
				{ id: "re_9", status: "action_logged", at: ts(-11, "09:00"), by: "دکتر نسرین کاویانی" },
				{ id: "re_10", status: "closed", at: ts(-10, "09:00"), by: "دکتر نسرین کاویانی" },
			], actions: [
				{ id: "ra_1", authorName: "دکتر نسرین کاویانی", note: "مرور انجام شد؛ ادامه مراقبت طبق برنامه ماما.", createdAt: ts(-11, "09:00") },
			] },
		],
		vaccinations: [
			{ id: "vc_1", childId: "ch_3", name: "نوبت ۲ ماهگی", dueDate: d(-192), doneDate: d(-190) },
			{ id: "vc_2", childId: "ch_3", name: "نوبت ۴ ماهگی", dueDate: d(-132), doneDate: d(-130) },
			{ id: "vc_3", childId: "ch_3", name: "نوبت ۶ ماهگی", dueDate: d(-72), doneDate: null },
			{ id: "vc_4", childId: "ch_1", name: "نوبت ۱۸ ماهگی", dueDate: d(-355), doneDate: d(-350) },
			{ id: "vc_5", childId: "ch_1", name: "نوبت ۶ سالگی", dueDate: d(1285), doneDate: null },
		],
		growth: [
			{ id: "gr_1", childId: "ch_3", date: d(-190), weightKg: 5.4, heightCm: 58, headCm: 39 },
			{ id: "gr_2", childId: "ch_3", date: d(-130), weightKg: 6.8, heightCm: 63, headCm: 41 },
			{ id: "gr_3", childId: "ch_3", date: d(-40), weightKg: 8.1, heightCm: 68, headCm: 43 },
			{ id: "gr_4", childId: "ch_1", date: d(-60), weightKg: 12.6, heightCm: 88 },
		],
		milestones: [
			{ id: "ms_1", childId: "ch_3", title: "نشستن بدون کمک", expectedAgeMonths: 6, achievedDate: d(-60), note: "ثبت شده توسط مادر." },
			{ id: "ms_2", childId: "ch_3", title: "راه افتادن با تکیه", expectedAgeMonths: 10, achievedDate: null },
			{ id: "ms_3", childId: "ch_1", title: "جمله‌سازی دوکلمه‌ای", expectedAgeMonths: 24, achievedDate: d(-120) },
		],
		healthRecords: [
			{ id: "hr_1", childId: "ch_3", date: d(-15), title: "سرماخوردگی خفیف", kind: "illness", description: "دو روز آبریزش بینی؛ بدون تب بالا." },
			{ id: "hr_2", childId: "ch_1", date: d(-200), title: "قطره آهن", kind: "medication", description: "طبق برنامه مرکز سلامت." },
		],
		notifications: [
			{ id: "nt_1", audience: "mother", motherId: "mo_1", title: "چکاپ نزدیک موعد", body: "مراقبت روتین بارداری تا دو روز دیگر برگزار می‌شود.", createdAt: ts(0, "07:00"), read: false, link: "/mother/checkups" },
			{ id: "nt_2", audience: "mother", motherId: "mo_1", title: "پاسخ ماما", body: "به سؤال شما درباره تغذیه پاسخ داده شد.", createdAt: ts(-5, "11:45"), read: true, link: "/mother/questions" },
			{ id: "nt_3", audience: "mother", motherId: "mo_1", title: "آزمایش عقب‌افتاده", body: "آزمایش خون دوره‌ای هنوز انجام نشده است.", createdAt: ts(-1, "08:00"), read: false, link: "/mother/checkups" },
			{ id: "nt_4", audience: "midwife", motherId: "mo_3", title: "سؤال جدید", body: "فاطمه حیدری سؤال جدیدی ثبت کرده است.", createdAt: ts(0, "08:06"), read: false, link: "/midwife/questions" },
			{ id: "nt_5", audience: "specialist", motherId: "mo_3", title: "ارجاع فوری", body: "یک ارجاع با سطح فوریت بالا دریافت شد.", createdAt: ts(0, "09:06"), read: false, link: "/specialist/referrals" },
		],
	}
}
