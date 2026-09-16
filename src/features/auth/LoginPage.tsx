import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../../app/providers/DataProvider"
import { useSession } from "../../app/providers/SessionProvider"
import type { Role } from "../../shared/types/domain"
import { ROLE_LABELS } from "../../shared/constants/labels"
import {
	Alert,
	Button,
	Field,
	Icon,
	LoadingState,
	PasswordInput,
	Select,
	TextInput,
} from "../../shared/components/ui"
import { motherFullName } from "../../services/selectors"

const POINTS = [
	{ icon: "pregnancy" as const, text: "پیگیری بارداری، چکاپ‌ها و علائم در یک پرونده یکجا" },
	{ icon: "child" as const, text: "مراقبت کودک: رشد، واکسیناسیون و روند تکامل" },
	{ icon: "users" as const, text: "ارتباط روشن میان مادر، ماما و متخصص" },
	{ icon: "shield" as const, text: "داده‌ها در این نسخه فقط در مرورگر خود شما ذخیره می‌شود" },
]

/** ورود نمایشی: انتخاب نقش و پرونده؛ احراز هویت واقعی پیاده‌سازی نشده است. */
export function LoginPage() {
	const { db, loading } = useData()
	const { session, signIn } = useSession()
	const navigate = useNavigate()
	const [role, setRole] = useState<Role>("mother")
	const [motherId, setMotherId] = useState("")
	const [providerId, setProviderId] = useState("")
	const [phone, setPhone] = useState("")
	const [password, setPassword] = useState("")
	const [passwordVisible, setPasswordVisible] = useState(false)
	const [errors, setErrors] = useState<{ phone?: string; password?: string; form?: string }>({})
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		if (session) navigate(`/${session.role}`, { replace: true })
	}, [session, navigate])

	useEffect(() => {
		if (!db) return
		if (role === "mother") setMotherId((current) => current || db.mothers[0]?.id || "")
		else {
			const first = db.providers.find((provider) => provider.role === role)
			setProviderId(first?.id ?? "")
		}
	}, [db, role])

	if (loading || !db)
		return (
			<div className="auth">
				<div className="auth__form-side">
					<div className="auth__form">
						<LoadingState rows={2} />
					</div>
				</div>
			</div>
		)

	const providers = db.providers.filter((provider) => provider.role === role)

	const submit = () => {
		const next: { phone?: string; password?: string; form?: string } = {}
		const digits = phone.replace(/\D/g, "")
		if (!digits) next.phone = "شماره موبایل را وارد کنید."
		else if (!/^09\d{9}$/.test(digits)) next.phone = "شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود."
		if (!password) next.password = "رمز عبور را وارد کنید."
		else if (password.length < 6) next.password = "رمز عبور دست‌کم ۶ کاراکتر باشد."

		if (Object.keys(next).length > 0) {
			setErrors(next)
			return
		}

		setSubmitting(true)
		if (role === "mother") {
			const mother = db.mothers.find((item) => item.id === motherId)
			if (!mother) {
				setSubmitting(false)
				setErrors({ form: "پرونده مادر را انتخاب کنید." })
				return
			}
			setErrors({})
			void signIn({ role, motherId: mother.id, displayName: motherFullName(mother) })
				.then(() => navigate("/mother", { replace: true }))
				.catch(() => setErrors({ form: "ورود به پنل ممکن نشد. دوباره تلاش کنید." }))
				.finally(() => setSubmitting(false))
			return
		}
		const provider = db.providers.find((item) => item.id === providerId)
		if (!provider) {
			setSubmitting(false)
			setErrors({ form: "مراقب سلامت را انتخاب کنید." })
			return
		}
		setErrors({})
		void signIn({ role, providerId: provider.id, displayName: provider.name })
			.then(() => navigate(`/${role}`, { replace: true }))
			.catch(() => setErrors({ form: "ورود به پنل ممکن نشد. دوباره تلاش کنید." }))
			.finally(() => setSubmitting(false))
	}

	return (
		<div className="auth">
			<section className="auth__brand" aria-hidden="true">
				<div className="auth__brand-inner">
					<div className="brand">
						<span className="brand__mark">
							<Icon name="heart" size={21} />
						</span>
						<span className="brand__text">
							<span className="brand__title">مراقبت مادر و کودک</span>
							<span className="brand__sub">همراه دوران بارداری تا سال‌های اول کودکی</span>
						</span>
					</div>
					<h2 className="auth__headline">مراقبتی آرام، منظم و قابل پیگیری برای مادر و کودک</h2>
					<p className="auth__lede">
						همه رویدادهای مراقبت در یک خط زمانی روشن ثبت می‌شود تا تصمیم‌های مراقبتی بر پایه اطلاعات کامل گرفته شود.
					</p>
					<ul className="auth__points">
						{POINTS.map((point) => (
							<li className="auth__point" key={point.text}>
								<span className="auth__point-icon">
									<Icon name={point.icon} size={18} />
								</span>
								<span>{point.text}</span>
							</li>
						))}
					</ul>
				</div>
			</section>

			<section className="auth__form-side">
				<form
					className="auth__form"
					onSubmit={(event) => {
						event.preventDefault()
						submit()
					}}
					noValidate
				>
					<div className="auth__mobile-brand">
						<div className="brand">
							<span className="brand__mark">
								<Icon name="heart" size={20} />
							</span>
							<span className="brand__text">
								<span className="brand__title">مراقبت مادر و کودک</span>
								<span className="brand__sub">ورود به پنل مراقبت</span>
							</span>
						</div>
					</div>

					<div>
						<h1 className="auth__title">خوش آمدید</h1>
						<p className="auth__desc">برای ورود، نقش خود و پرونده مورد نظر را انتخاب کنید.</p>
					</div>

					<Alert tone="info">
						این یک نسخه نمایشی است. شماره موبایل و رمز فقط از نظر قالب بررسی می‌شوند و هیچ احراز هویت
						واقعی، پیامک تأیید یا سروری در میان نیست.
					</Alert>

					<div className="auth__fields">
						<Field label="شماره موبایل" hint="نمونه: ۰۹۱۲۳۴۵۶۷۸۹" error={errors.phone}>
							<TextInput
								value={phone}
								onChange={(value) => setPhone(value)}
								type="tel"
								inputMode="tel"
								placeholder="09xxxxxxxxx"
								invalid={Boolean(errors.phone)}
							/>
						</Field>

						<Field label="رمز عبور" error={errors.password}>
							<PasswordInput
								value={password}
								onChange={(value) => setPassword(value)}
								visible={passwordVisible}
								onToggleVisible={() => setPasswordVisible((visible) => !visible)}
								placeholder="دست‌کم ۶ کاراکتر"
								invalid={Boolean(errors.password)}
							/>
						</Field>

						<Field label="نقش کاربری">
							<Select
								value={role}
								onChange={(value) => setRole(value as Role)}
								options={[
									{ value: "mother", label: ROLE_LABELS.mother },
									{ value: "midwife", label: ROLE_LABELS.midwife },
									{ value: "specialist", label: ROLE_LABELS.specialist },
								]}
							/>
						</Field>

						{role === "mother" ? (
							<Field
								label="پرونده مادر"
								hint="داده نمایشی چند پرونده متفاوت دارد تا حالت‌های مختلف را ببینید."
							>
								<Select
									value={motherId}
									onChange={(value) => setMotherId(value)}
									options={db.mothers.map((mother) => ({
										value: mother.id,
										label: motherFullName(mother),
									}))}
								/>
							</Field>
						) : (
							<Field label="مراقب سلامت">
								<Select
									value={providerId}
									onChange={(value) => setProviderId(value)}
									options={providers.map((provider) => ({
										value: provider.id,
										label: provider.specialty
											? `${provider.name} — ${provider.specialty}`
											: provider.name,
									}))}
								/>
							</Field>
						)}
					</div>

					{errors.form && <Alert tone="danger">{errors.form}</Alert>}

					<Button type="submit" variant="primary" block loading={submitting}>
						ورود به پنل
					</Button>

					<p className="auth__foot">این نسخه جایگزین مراقبت پزشکی نیست و فقط برای پیگیری اطلاعات کاربرد دارد.</p>
				</form>
			</section>
		</div>
	)
}
