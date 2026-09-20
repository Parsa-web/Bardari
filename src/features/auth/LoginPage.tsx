import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../../app/providers/DataProvider"
import { useSession } from "../../app/providers/SessionProvider"
import {
	authService,
	estimateEdd,
	isValidIranianMobile,
	MIN_PASSWORD_LENGTH,
	normalizePhone,
	validateLmpDate,
	type AuthSession,
} from "../../services/auth/authService"
import { DEMO_PASSWORD } from "../../services/mock/seed"
import {
	Alert,
	Button,
	Field,
	LoadingState,
	PasswordInput,
	Select,
	TextInput,
} from "../../shared/components/ui"
import { JalaliDateInput } from "../../shared/components/DateInput"
import { Icon } from "../../shared/components/icons"
import { MOTHER_STATUS_LABELS, NOT_RECORDED } from "../../shared/constants/labels"
import type { MotherCurrentStatus, Role } from "../../shared/types/domain"
import { diffInDays, formatDate, toFa, todayIso } from "../../shared/utils/date"
import { REGISTER_SUCCESS_DESC, REGISTER_SUCCESS_TITLE } from "./successText"
import "../../styles/auth.css"

type Mode = "login" | "register" | "registered"
type StepId = 1 | 2 | 3 | 4

type RegisterForm = {
	firstName: string
	lastName: string
	phone: string
	password: string
	confirm: string
	birthDate: string
	currentStatus: "" | MotherCurrentStatus
	lmpDate: string
}

const EMPTY_REGISTER: RegisterForm = {
	firstName: "",
	lastName: "",
	phone: "",
	password: "",
	confirm: "",
	birthDate: "",
	currentStatus: "",
	lmpDate: "",
}

const STEP_TITLES: Record<StepId, string> = {
	1: "اطلاعات حساب",
	2: "اطلاعات مادر",
	3: "اطلاعات بارداری",
	4: "بررسی",
}

const STATUS_OPTIONS = [
	{ value: "", label: "انتخاب کنید" },
	{ value: "planning", label: MOTHER_STATUS_LABELS.planning },
	{ value: "pregnant", label: MOTHER_STATUS_LABELS.pregnant },
	{ value: "not_pregnant", label: MOTHER_STATUS_LABELS.not_pregnant },
	{ value: "postpartum", label: MOTHER_STATUS_LABELS.postpartum },
]

const POINTS: Array<{ icon: "pregnancy" | "child" | "users"; text: string }> = [
	{ icon: "pregnancy", text: "پیگیری دوران بارداری بر پایه اطلاعات ثبت‌شده" },
	{ icon: "child", text: "پرونده جداگانه برای هر کودک" },
	{ icon: "users", text: "ارتباط منظم با ماما و متخصص" },
]

const MAX_NAME = 40

function toSessionInput(session: AuthSession) {
	return session.role === "mother"
		? {
				role: session.role,
				motherId: session.motherId ?? undefined,
				displayName: session.displayName,
			}
		: {
				role: session.role,
				providerId: session.providerId ?? undefined,
				displayName: session.displayName,
			}
}

function BrandLockup({ subtitle }: { subtitle: string }) {
	return (
		<div className="authx__lockup">
			<span className="authx__mark" aria-hidden="true">
				<Icon name="heart" size={20} />
			</span>
			<span>
				<span className="authx__name">سامانه مراقبت مادر و کودک</span>
				<span className="authx__tag">{subtitle}</span>
			</span>
		</div>
	)
}

export default function LoginPage() {
	const navigate = useNavigate()
	const { session, signIn } = useSession()
	const { db, loading, mutate } = useData()

	const [mode, setMode] = useState<Mode>("login")
	const [step, setStep] = useState<StepId>(1)
	const [busy, setBusy] = useState(false)

	const [loginPhone, setLoginPhone] = useState("")
	const [loginPassword, setLoginPassword] = useState("")
	const [showLoginPassword, setShowLoginPassword] = useState(false)
	const [loginErrors, setLoginErrors] = useState<{ phone?: string; password?: string }>({})
	const [loginAlert, setLoginAlert] = useState<string | null>(null)

	const [form, setForm] = useState<RegisterForm>(EMPTY_REGISTER)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [registerAlert, setRegisterAlert] = useState<string | null>(null)
	const [createdSession, setCreatedSession] = useState<AuthSession | null>(null)

	useEffect(() => {
		if (session) navigate(`/${session.role}`, { replace: true })
	}, [session, navigate])

	const isPregnant = form.currentStatus === "pregnant"
	const steps: StepId[] = useMemo(() => (isPregnant ? [1, 2, 3, 4] : [1, 2, 4]), [isPregnant])
	const estimatedEdd = useMemo(() => estimateEdd(form.lmpDate || null), [form.lmpDate])

	const set = (patch: Partial<RegisterForm>) => {
		setForm((previous) => ({ ...previous, ...patch }))
	}

	const resetRegistration = () => {
		setForm(EMPTY_REGISTER)
		setErrors({})
		setRegisterAlert(null)
		setStep(1)
		setShowPassword(false)
		setShowConfirm(false)
	}

	const goLogin = () => {
		resetRegistration()
		setMode("login")
	}

	const goRegister = () => {
		setErrors({})
		setRegisterAlert(null)
		setStep(1)
		setMode("register")
	}

	const fillDemo = (role: Role) => {
		const account = db?.accounts.find((item) => item.role === role)
		if (!account) return
		setLoginPhone(account.phone)
		setLoginPassword(DEMO_PASSWORD)
		setLoginErrors({})
		setLoginAlert(null)
	}

	const submitLogin = async (event: FormEvent) => {
		event.preventDefault()
		if (!db || busy) return
		const next: { phone?: string; password?: string } = {}
		if (!loginPhone.trim()) next.phone = "شماره موبایل را وارد کنید."
		else if (!isValidIranianMobile(loginPhone)) next.phone = "شماره موبایل واردشده معتبر نیست."
		if (!loginPassword) next.password = "رمز عبور را وارد کنید."
		setLoginErrors(next)
		setLoginAlert(null)
		if (Object.keys(next).length > 0) return

		setBusy(true)
		const outcome = await authService.signIn(db, {
			phone: loginPhone,
			password: loginPassword,
		})
		if (!outcome.ok) {
			setBusy(false)
			setLoginAlert(
				outcome.reason === "broken_account"
					? "این حساب نمایشی کامل نیست. لطفاً داده نمایشی را بازنشانی کنید."
					: "شماره موبایل یا رمز عبور صحیح نیست.",
			)
			return
		}
		await signIn(toSessionInput(outcome.session))
		setBusy(false)
		navigate(`/${outcome.session.role}`, { replace: true })
	}

	const validateStep1 = () => {
		const next: Record<string, string> = {}
		const firstName = form.firstName.trim()
		const lastName = form.lastName.trim()
		if (!firstName) next.firstName = "نام را وارد کنید."
		else if (firstName.length > MAX_NAME) next.firstName = "نام واردشده بیش از حد طولانی است."
		if (!lastName) next.lastName = "نام خانوادگی را وارد کنید."
		else if (lastName.length > MAX_NAME)
			next.lastName = "نام خانوادگی واردشده بیش از حد طولانی است."
		if (!form.phone.trim()) next.phone = "شماره موبایل را وارد کنید."
		else if (!isValidIranianMobile(form.phone)) next.phone = "شماره موبایل واردشده معتبر نیست."
		else if (
			db?.accounts.some((item) => normalizePhone(item.phone) === normalizePhone(form.phone))
		) {
			next.phone = "این شماره موبایل قبلاً ثبت شده است."
		}
		if (!form.password) next.password = "رمز عبور را وارد کنید."
		else if (form.password.length < MIN_PASSWORD_LENGTH) {
			next.password = `رمز عبور باید حداقل ${toFa(String(MIN_PASSWORD_LENGTH))} کاراکتر باشد.`
		}
		if (!form.confirm) next.confirm = "تکرار رمز عبور را وارد کنید."
		else if (form.confirm !== form.password)
			next.confirm = "تکرار رمز عبور با رمز عبور یکسان نیست."
		return next
	}

	const validateStep2 = () => {
		const next: Record<string, string> = {}
		if (form.birthDate) {
			const elapsed = diffInDays(form.birthDate, todayIso())
			if (elapsed === null) next.birthDate = "تاریخ تولد واردشده معتبر نیست."
			else if (elapsed < 0) next.birthDate = "تاریخ تولد نمی‌تواند در آینده باشد."
			else if (elapsed < 3650) next.birthDate = "تاریخ تولد واردشده منطقی نیست."
		}
		if (!form.currentStatus) next.currentStatus = "وضعیت فعلی خود را انتخاب کنید."
		return next
	}

	const validateStep3 = () => {
		const next: Record<string, string> = {}
		if (form.lmpDate) {
			const message = validateLmpDate(form.lmpDate)
			if (message) next.lmpDate = message
		}
		return next
	}

	const continueFrom = (current: StepId) => {
		const next =
			current === 1 ? validateStep1() : current === 2 ? validateStep2() : validateStep3()
		setErrors(next)
		if (Object.keys(next).length > 0) return
		const index = steps.indexOf(current)
		const target = steps[index + 1] ?? 4
		setStep(target)
	}

	const backFrom = (current: StepId) => {
		setErrors({})
		const index = steps.indexOf(current)
		if (index <= 0) {
			goLogin()
			return
		}
		const previous = steps[index - 1]
		setStep(previous ?? 1)
	}

	const submitRegistration = async () => {
		if (!db || busy) return
		const basic = validateStep1()
		if (Object.keys(basic).length > 0) {
			setErrors(basic)
			setStep(1)
			return
		}
		const profile = validateStep2()
		if (Object.keys(profile).length > 0) {
			setErrors(profile)
			setStep(2)
			return
		}
		if (isPregnant) {
			const pregnancy = validateStep3()
			if (Object.keys(pregnancy).length > 0) {
				setErrors(pregnancy)
				setStep(3)
				return
			}
		}

		setBusy(true)
		setRegisterAlert(null)
		const outcome = await authService.registerMother(db, {
			firstName: form.firstName,
			lastName: form.lastName,
			phone: form.phone,
			password: form.password,
			birthDate: form.birthDate || null,
			currentStatus: form.currentStatus as MotherCurrentStatus,
			pregnancy: isPregnant ? { lmpDate: form.lmpDate || null } : null,
		})
		if (!outcome.ok) {
			setBusy(false)
			setErrors({ phone: "این شماره موبایل قبلاً ثبت شده است." })
			setRegisterAlert(
				"این شماره موبایل قبلاً ثبت شده است. می‌توانید با همین شماره وارد حساب شوید.",
			)
			setStep(1)
			return
		}
		try {
			await Promise.resolve(mutate(() => outcome.db))
		} catch {
			setBusy(false)
			setRegisterAlert("ذخیره اطلاعات در این مرورگر انجام نشد. دوباره تلاش کنید.")
			return
		}
		setBusy(false)
		setCreatedSession(outcome.session)
		setMode("registered")
	}

	const enterAfterRegister = async () => {
		if (!createdSession) return
		await signIn(toSessionInput(createdSession))
		navigate(`/${createdSession.role}`, { replace: true })
	}

	if (loading || !db) {
		return (
			<div className="authx">
				<div className="authx__card">
					<div className="authx__pane">
						<div className="authx__form">
							<LoadingState rows={4} />
						</div>
					</div>
				</div>
			</div>
		)
	}

	const statusLabel = form.currentStatus ? MOTHER_STATUS_LABELS[form.currentStatus] : NOT_RECORDED

	const renderSteps = () => (
		<ol className="authx__steps">
			{steps.map((item, index) => {
				const isActive = item === step
				const isDone = steps.indexOf(step) > index
				return (
					<li
						key={item}
						className={`authx__step${isActive ? " authx__step--active" : ""}${
							isDone ? " authx__step--done" : ""
						}`}
						aria-current={isActive ? "step" : undefined}
					>
						<span className="authx__step-num">{toFa(String(index + 1))}</span>
						<span>{STEP_TITLES[item]}</span>
					</li>
				)
			})}
		</ol>
	)

	const renderSummaryRow = (title: string, items: string[], target: StepId) => (
		<div className="authx__summary-row">
			<div className="authx__summary-body">
				<span className="authx__summary-title">{title}</span>
				{items.map((item) => (
					<span className="authx__summary-item" key={item}>
						{item}
					</span>
				))}
			</div>
			<Button
				variant="ghost"
				size="sm"
				onClick={() => {
					setErrors({})
					setStep(target)
				}}
			>
				ویرایش
			</Button>
		</div>
	)

	const loginView = (
		<form className="authx__form" onSubmit={submitLogin} noValidate>
			<div className="authx__mobile-brand">
				<BrandLockup subtitle="نسخه نمایشی" />
			</div>
			<div className="authx__head">
				<h1 className="authx__title">ورود به حساب</h1>
				<p className="authx__desc">با شماره موبایل و رمز عبور خود وارد شوید.</p>
			</div>

			{loginAlert ? <Alert tone="danger">{loginAlert}</Alert> : null}

			<div className="authx__fields">
				<Field label="شماره موبایل" error={loginErrors.phone}>
					<TextInput
						value={loginPhone}
						onChange={(value) => setLoginPhone(value)}
						type="tel"
						inputMode="numeric"
						placeholder="09120000001"
						invalid={Boolean(loginErrors.phone)}
						disabled={busy}
					/>
				</Field>
				<Field label="رمز عبور" error={loginErrors.password}>
					<PasswordInput
						value={loginPassword}
						onChange={(value) => setLoginPassword(value)}
						placeholder="رمز عبور حساب شما"
						visible={showLoginPassword}
						onToggleVisible={() => setShowLoginPassword((value) => !value)}
						invalid={Boolean(loginErrors.password)}
						disabled={busy}
					/>
				</Field>
			</div>

			<div className="authx__actions">
				<Button type="submit" variant="primary" block loading={busy}>
					ورود
				</Button>
			</div>

			<div className="authx__signup">
				<span className="authx__signup-text">
					<span className="authx__signup-title">مادر جدید هستید؟</span>
					<span className="authx__signup-hint">در چند مرحله کوتاه حساب خود را بسازید.</span>
				</span>
				<Button variant="outline" size="sm" icon="plus" onClick={goRegister} disabled={busy}>
					ثبت‌نام کنید
				</Button>
			</div>

			<div className="authx__demo">
				<span className="authx__demo-title">
					این نسخه نمایشی است و داده‌ها فقط در همین مرورگر ذخیره می‌شوند. برای مرور سریع،
					اطلاعات یکی از حساب‌های نمایشی را در فرم قرار دهید:
				</span>
				<div className="authx__demo-row">
					<Button variant="ghost" size="sm" onClick={() => fillDemo("mother")} disabled={busy}>
						حساب مادر
					</Button>
					<Button variant="ghost" size="sm" onClick={() => fillDemo("midwife")} disabled={busy}>
						حساب ماما
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => fillDemo("specialist")}
						disabled={busy}
					>
						حساب متخصص
					</Button>
				</div>
			</div>
		</form>
	)

	const registerView = (
		<form
			className="authx__form"
			onSubmit={(event) => {
				event.preventDefault()
				if (step === 4) void submitRegistration()
				else continueFrom(step)
			}}
			noValidate
		>
			<div className="authx__mobile-brand">
				<BrandLockup subtitle="ثبت‌نام مادر" />
			</div>
			<div className="authx__head">
				<h1 className="authx__title">ثبت‌نام مادر</h1>
				<p className="authx__desc">
					در چند مرحله کوتاه حساب شما ساخته می‌شود. اطلاعات بیشتر را بعداً ثبت می‌کنید.
				</p>
			</div>

			{renderSteps()}

			{registerAlert ? <Alert tone="danger">{registerAlert}</Alert> : null}

			{step === 1 ? (
				<div className="authx__fields">
					<Field label="نام" error={errors.firstName}>
						<TextInput
							value={form.firstName}
							onChange={(value) => set({ firstName: value })}
							placeholder="نام خود را وارد کنید"
							invalid={Boolean(errors.firstName)}
							disabled={busy}
						/>
					</Field>
					<Field label="نام خانوادگی" error={errors.lastName}>
						<TextInput
							value={form.lastName}
							onChange={(value) => set({ lastName: value })}
							placeholder="نام خانوادگی خود را وارد کنید"
							invalid={Boolean(errors.lastName)}
							disabled={busy}
						/>
					</Field>
					<Field
						label="شماره موبایل"
						hint="با این شماره وارد حساب می‌شوید."
						error={errors.phone}
					>
						<TextInput
							value={form.phone}
							onChange={(value) => set({ phone: value })}
							type="tel"
							inputMode="numeric"
							placeholder="09123456789"
							invalid={Boolean(errors.phone)}
							disabled={busy}
						/>
					</Field>
					<Field
						label="رمز عبور"
						hint={`حداقل ${toFa(String(MIN_PASSWORD_LENGTH))} کاراکتر.`}
						error={errors.password}
					>
						<PasswordInput
							value={form.password}
							onChange={(value) => set({ password: value })}
							placeholder="یک رمز عبور انتخاب کنید"
							visible={showPassword}
							onToggleVisible={() => setShowPassword((value) => !value)}
							invalid={Boolean(errors.password)}
							disabled={busy}
						/>
					</Field>
					<Field label="تکرار رمز عبور" error={errors.confirm}>
						<PasswordInput
							value={form.confirm}
							onChange={(value) => set({ confirm: value })}
							placeholder="رمز عبور را دوباره وارد کنید"
							visible={showConfirm}
							onToggleVisible={() => setShowConfirm((value) => !value)}
							invalid={Boolean(errors.confirm)}
							disabled={busy}
						/>
					</Field>
				</div>
			) : null}

			{step === 2 ? (
				<div className="authx__fields">
					<Field
						label="تاریخ تولد (شمسی)"
						hint="وارد کردن این تاریخ اختیاری است."
						error={errors.birthDate}
					>
						<JalaliDateInput
							value={form.birthDate}
							onChange={(value) => set({ birthDate: value })}
							yearsBack={70}
							yearsAhead={0}
							invalid={Boolean(errors.birthDate)}
							disabled={busy}
						/>
					</Field>
					<Field label="وضعیت فعلی" error={errors.currentStatus}>
						<Select
							value={form.currentStatus}
							onChange={(value) => set({ currentStatus: value as "" | MotherCurrentStatus })}
							options={STATUS_OPTIONS}
							invalid={Boolean(errors.currentStatus)}
							disabled={busy}
						/>
					</Field>
				</div>
			) : null}

			{step === 3 ? (
				<div className="authx__fields">
					<Field
						label="تاریخ شروع آخرین قاعدگی (شمسی)"
						hint="اگر این تاریخ را نمی‌دانید، خالی بگذارید و بعداً ثبت کنید."
						error={errors.lmpDate}
					>
						<JalaliDateInput
							value={form.lmpDate}
							onChange={(value) => set({ lmpDate: value })}
							yearsBack={2}
							yearsAhead={0}
							invalid={Boolean(errors.lmpDate)}
							disabled={busy}
						/>
					</Field>
					<Alert tone="info">
						تاریخ احتمالی زایمان: {estimatedEdd ? formatDate(estimatedEdd) : NOT_RECORDED}
					</Alert>
				</div>
			) : null}

			{step === 4 ? (
				<div className="authx__summary">
					{renderSummaryRow(
						"اطلاعات حساب",
						[
							`نام و نام خانوادگی: ${form.firstName.trim()} ${form.lastName.trim()}`,
							`شماره موبایل: ${toFa(normalizePhone(form.phone))}`,
						],
						1,
					)}
					{renderSummaryRow(
						"اطلاعات مادر",
						[
							`تاریخ تولد: ${form.birthDate ? formatDate(form.birthDate) : NOT_RECORDED}`,
							`وضعیت فعلی: ${statusLabel}`,
						],
						2,
					)}
					{isPregnant
						? renderSummaryRow(
								"اطلاعات بارداری",
								[
									`شروع آخرین قاعدگی: ${
										form.lmpDate ? formatDate(form.lmpDate) : NOT_RECORDED
									}`,
									`تاریخ احتمالی زایمان: ${
										estimatedEdd ? formatDate(estimatedEdd) : NOT_RECORDED
									}`,
								],
								3,
							)
						: null}
					<span className="authx__foot">
						این اطلاعات فقط در همین مرورگر ذخیره می‌شود و به هیچ سروری ارسال نمی‌شود.
					</span>
				</div>
			) : null}

			<div className="authx__actions">
				<Button type="submit" variant="primary" block loading={busy}>
					{step === 4 ? "ایجاد حساب" : "ادامه"}
				</Button>
				<Button variant="outline" block onClick={() => backFrom(step)} disabled={busy}>
					{steps.indexOf(step) === 0 ? "بازگشت به ورود" : "مرحله قبل"}
				</Button>
			</div>

			<div className="authx__switch">
				<span>حساب کاربری دارید؟</span>
				<Button variant="ghost" size="sm" onClick={goLogin} disabled={busy}>
					وارد شوید
				</Button>
			</div>
		</form>
	)

	const successView = (
		<div className="authx__form">
			<div className="authx__mobile-brand">
				<BrandLockup subtitle="ثبت‌نام مادر" />
			</div>
			<div className="authx__success">
				<span className="authx__success-icon" aria-hidden="true">
					<Icon name="check" size={24} />
				</span>
				<div className="authx__head">
					<h1 className="authx__title">{REGISTER_SUCCESS_TITLE}</h1>
					<p className="authx__desc">{REGISTER_SUCCESS_DESC}</p>
				</div>
				<Button variant="primary" block onClick={() => void enterAfterRegister()}>
					ورود به حساب
				</Button>
				<span className="authx__foot">
					این حساب نمایشی است و تا زمانی که داده نمایشی بازنشانی نشود در همین مرورگر باقی
					می‌ماند.
				</span>
			</div>
		</div>
	)

	return (
		<div className="authx">
			<div className="authx__card">
				<aside className="authx__brand">
					<BrandLockup subtitle="مراقبت یکپارچه مادر و کودک" />
					<div>
						<h2 className="authx__headline">پیگیری آرام و منظم سلامت مادر و کودک</h2>
						<p className="authx__lede">
							هر چیزی که ثبت می‌کنید در جای خودش باقی می‌ماند: بارداری، کودک و پرونده خود مادر
							جداگانه نگهداری می‌شوند.
						</p>
						<div className="authx__points">
							{POINTS.map((point) => (
								<div className="authx__point" key={point.text}>
									<span className="authx__point-icon" aria-hidden="true">
										<Icon name={point.icon} size={16} />
									</span>
									<span>{point.text}</span>
								</div>
							))}
						</div>
					</div>
					<p className="authx__brand-foot">
						این نسخه نمایشی است؛ احراز هویت واقعی، پیامک یا سروری در این مرحله وجود ندارد.
					</p>
				</aside>
				<section className="authx__pane">
					{mode === "login" ? loginView : mode === "register" ? registerView : successView}
				</section>
			</div>
		</div>
	)
}
