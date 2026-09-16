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
import { Icon } from "../../shared/components/icons"
import { MOTHER_STATUS_LABELS, NOT_RECORDED } from "../../shared/constants/labels"
import type { MotherCurrentStatus, Role } from "../../shared/types/domain"
import { diffInDays, formatDate, toFa, todayIso } from "../../shared/utils/date"
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
	1: "\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u062d\u0633\u0627\u0628",
	2: "\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0645\u0627\u062f\u0631",
	3: "\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627\u0631\u062f\u0627\u0631\u06cc",
	4: "\u0628\u0631\u0631\u0633\u06cc",
}

const STATUS_OPTIONS = [
	{ value: "", label: "\u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f" },
	{ value: "planning", label: MOTHER_STATUS_LABELS.planning },
	{ value: "pregnant", label: MOTHER_STATUS_LABELS.pregnant },
	{ value: "not_pregnant", label: MOTHER_STATUS_LABELS.not_pregnant },
	{ value: "postpartum", label: MOTHER_STATUS_LABELS.postpartum },
]

const POINTS: Array<{ icon: "pregnancy" | "child" | "users"; text: string }> = [
	{
		icon: "pregnancy",
		text: "\u067e\u06cc\u06af\u06cc\u0631\u06cc \u062f\u0648\u0631\u0627\u0646 \u0628\u0627\u0631\u062f\u0627\u0631\u06cc \u0628\u0631 \u067e\u0627\u06cc\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u062b\u0628\u062a\u200c\u0634\u062f\u0647",
	},
	{
		icon: "child",
		text: "\u067e\u0631\u0648\u0646\u062f\u0647 \u062c\u062f\u0627\u06af\u0627\u0646\u0647 \u0628\u0631\u0627\u06cc \u0647\u0631 \u06a9\u0648\u062f\u06a9",
	},
	{
		icon: "users",
		text: "\u0627\u0631\u062a\u0628\u0627\u0637 \u0645\u0646\u0637\u0642\u0645 \u0628\u0627 \u0645\u0627\u0645\u0627 \u0648 \u0645\u062a\u062e\u0635\u0635",
	},
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
				<span className="authx__name">
					\u0633\u0627\u0645\u0627\u0646\u0647 \u0645\u0631\u0627\u0642\u0628\u062a \u0645\u0627\u062f\u0631 \u0648 \u06a9\u0648\u062f\u06a9
				</span>
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
		if (!loginPhone.trim())
			next.phone = "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f."
		else if (!isValidIranianMobile(loginPhone))
			next.phone = "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u0648\u0627\u0631\u062f\u0634\u062f\u0647 \u0645\u0639\u062a\u0628\u0631 \u0646\u06cc\u0633\u062a."
		if (!loginPassword)
			next.password = "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f."
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
					? "\u0627\u06cc\u0646 \u062d\u0633\u0627\u0628 \u0646\u0645\u0627\u06cc\u0634\u06cc \u06a9\u0627\u0645\u0644 \u0646\u06cc\u0633\u062a. \u0644\u0637\u0641\u0627\u064b \u062f\u0627\u062f\u0647 \u0646\u0645\u0627\u06cc\u0634\u06cc \u0631\u0627 \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06cc \u06a9\u0646\u06cc\u062f."
					: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u06cc\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0635\u062d\u06cc\u062d \u0646\u06cc\u0633\u062a.",
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
		if (!firstName) next.firstName = "\u0646\u0627\u0645 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f."
		else if (firstName.length > MAX_NAME)
			next.firstName = "\u0646\u0627\u0645 \u0648\u0627\u0631\u062f\u0634\u062f\u0647 \u0628\u06cc\u0634 \u0627\u0632 \u062d\u062f \u0637\u0648\u0644\u0627\u0646\u06cc \u0627\u0633\u062a."
		if (!lastName)
			next.lastName = "\u0646\u0627\u0645 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f."
		else if (lastName.length > MAX_NAME)
			next.lastName = "\u0646\u0627\u0645 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc \u0648\u0627\u0631\u062f\u0634\u062f\u0647 \u0628\u06cc\u0634 \u0627\u0632 \u062d\u062f \u0637\u0648\u0644\u0627\u0646\u06cc \u0627\u0633\u062a."
		if (!form.phone.trim())
			next.phone = "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f."
		else if (!isValidIranianMobile(form.phone))
			next.phone = "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u0648\u0627\u0631\u062f\u0634\u062f\u0647 \u0645\u0639\u062a\u0628\u0631 \u0646\u06cc\u0633\u062a."
		else if (db?.accounts.some((item) => normalizePhone(item.phone) === normalizePhone(form.phone))) {
			next.phone = "\u0627\u06cc\u0646 \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u0642\u0628\u0644\u0627\u064b \u062b\u0628\u062a \u0634\u062f\u0647 \u0627\u0633\u062a."
		}
		if (!form.password)
			next.password = "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f."
		else if (form.password.length < MIN_PASSWORD_LENGTH) {
			next.password = `\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627\u06cc\u062f \u062d\u062f\u0627\u0642\u0644 ${toFa(String(MIN_PASSWORD_LENGTH))} \u06a9\u0627\u0631\u0627\u06a9\u062a\u0631 \u0628\u0627\u0634\u062f.`
		}
		if (!form.confirm)
			next.confirm = "\u062a\u06a9\u0631\u0627\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f."
		else if (form.confirm !== form.password)
			next.confirm = "\u062a\u06a9\u0631\u0627\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u06cc\u06a9\u0633\u0627\u0646 \u0646\u06cc\u0633\u062a."
		return next
	}

	const validateStep2 = () => {
		const next: Record<string, string> = {}
		if (form.birthDate) {
			const elapsed = diffInDays(form.birthDate, todayIso())
			if (elapsed === null)
				next.birthDate = "\u062a\u0627\u0631\u06cc\u062e \u062a\u0648\u0644\u062f \u0648\u0627\u0631\u062f\u0634\u062f\u0647 \u0645\u0639\u062a\u0628\u0631 \u0646\u06cc\u0633\u062a."
			else if (elapsed < 0)
				next.birthDate = "\u062a\u0627\u0631\u06cc\u062e \u062a\u0648\u0644\u062f \u0646\u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u062f \u062f\u0631 \u0622\u06cc\u0646\u062f\u0647 \u0628\u0627\u0634\u062f."
			else if (elapsed < 3650)
				next.birthDate = "\u062a\u0627\u0631\u06cc\u062e \u062a\u0648\u0644\u062f \u0648\u0627\u0631\u062f\u0634\u062f\u0647 \u0645\u0646\u0637\u0642\u06cc \u0646\u06cc\u0633\u062a."
		}
		if (!form.currentStatus)
			next.currentStatus = "\u0648\u0636\u0639\u06cc\u062a \u0641\u0639\u0644\u06cc \u062e\u0648\u062f \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f."
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
		const next = current === 1 ? validateStep1() : current === 2 ? validateStep2() : validateStep3()
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
			setErrors({
				phone: "\u0627\u06cc\u0646 \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u0642\u0628\u0644\u0627\u064b \u062b\u0628\u062a \u0634\u062f\u0647 \u0627\u0633\u062a.",
			})
			setRegisterAlert(
				"\u0627\u06cc\u0646 \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u0642\u0628\u0644\u0627\u064b \u062b\u0628\u062a \u0634\u062f\u0647 \u0627\u0633\u062a. \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u06cc\u062f \u0628\u0627 \u0647\u0645\u06cc\u0646 \u0634\u0645\u0627\u0631\u0647 \u0648\u0627\u0631\u062f \u062d\u0633\u0627\u0628 \u0634\u0648\u06cc\u062f.",
			)
			setStep(1)
			return
		}
		try {
			await Promise.resolve(mutate(() => outcome.db))
		} catch {
			setBusy(false)
			setRegisterAlert(
				"\u0630\u062e\u06cc\u0631\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u062f\u0631 \u0627\u06cc\u0646 \u0645\u0631\u0648\u0631\u06af\u0631 \u0627\u0646\u062c\u0627\u0645 \u0646\u0634\u062f. \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.",
			)
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
				\u0648\u06cc\u0631\u0627\u06cc\u0634
			</Button>
		</div>
	)

	const loginView = (
		<form className="authx__form" onSubmit={submitLogin} noValidate>
			<div className="authx__mobile-brand">
				<BrandLockup subtitle="\u0646\u0633\u062e\u0647 \u0646\u0645\u0627\u06cc\u0634\u06cc" />
			</div>
			<div className="authx__head">
				<h1 className="authx__title">\u0648\u0631\u0648\u062f \u0628\u0647 \u062d\u0633\u0627\u0628</h1>
				<p className="authx__desc">
					\u0628\u0627 \u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644 \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062e\u0648\u062f \u0648\u0627\u0631\u062f \u0634\u0648\u06cc\u062f.
				</p>
			</div>

			{loginAlert ? <Alert tone="danger">{loginAlert}</Alert> : null}

			<div className="authx__fields">
				<Field label="\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644" error={loginErrors.phone}>
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
				<Field label="\u0631\u0645\u0632 \u0639\u0628\u0648\u0631" error={loginErrors.password}>
					<PasswordInput
						value={loginPassword}
						onChange={(value) => setLoginPassword(value)}
						placeholder="\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062d\u0633\u0627\u0628 \u0634\u0645\u0627"
						visible={showLoginPassword}
						onToggleVisible={() => setShowLoginPassword((value) => !value)}
						invalid={Boolean(loginErrors.password)}
						disabled={busy}
					/>
				</Field>
			</div>

			<div className="authx__actions">
				<Button type="submit" variant="primary" block loading={busy}>
					\u0648\u0631\u0648\u062f
				</Button>
			</div>

			<div className="authx__signup">
				<span className="authx__signup-text">
					<span className="authx__signup-title">
						\u0645\u0627\u062f\u0631 \u062c\u062f\u06cc\u062f \u0647\u0633\u062a\u06cc\u062f\u061f
					</span>
					<span className="authx__signup-hint">
						\u062f\u0631 \u0686\u0646\u062f \u0645\u0631\u062d\u0644\u0647 \u06a9\u0648\u062a\u0627\u0647 \u062d\u0633\u0627\u0628 \u062e\u0648\u062f \u0631\u0627 \u0628\u0633\u0627\u0632\u06cc\u062f.
					</span>
				</span>
				<Button variant="outline" size="sm" icon="plus" onClick={goRegister} disabled={busy}>
					\u062b\u0628\u062a\u200c\u0646\u0627\u0645 \u06a9\u0646\u06cc\u062f
				</Button>
			</div>

			<div className="authx__demo">
				<span className="authx__demo-title">
					\u0627\u06cc\u0646 \u06cc\u06a9 \u0646\u0633\u062e\u0647 \u0646\u0645\u0627\u06cc\u0634\u06cc \u0627\u0633\u062a \u0648 \u0647\u0645\u0647 \u062f\u0627\u062f\u0647\u200c\u0647\u0627 \u0641\u0642\u0637 \u062f\u0631 \u0647\u0645\u06cc\u0646 \u0645\u0631\u0648\u0631\u06af\u0631 \u0630\u062e\u06cc\u0631\u0647 \u0645\u06cc\u200c\u0634\u0648\u0646\u062f. \u0628\u0631\u0627\u06cc \u0645\u0631\u0648\u0631 \u0633\u0631\u06cc\u0639\u060c \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u06cc\u06a9\u06cc \u0627\u0632 \u062d\u0633\u0627\u0628\u200c\u0647\u0627\u06cc \u0646\u0645\u0627\u06cc\u0634\u06cc \u0631\u0627 \u062f\u0631 \u0641\u0631\u0645 \u0642\u0631\u0627\u0631 \u062f\u0647\u06cc\u062f:
				</span>
				<div className="authx__demo-row">
					<Button variant="ghost" size="sm" onClick={() => fillDemo("mother")} disabled={busy}>
						\u062d\u0633\u0627\u0628 \u0645\u0627\u062f\u0631
					</Button>
					<Button variant="ghost" size="sm" onClick={() => fillDemo("midwife")} disabled={busy}>
						\u062d\u0633\u0627\u0628 \u0645\u0627\u0645\u0627
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => fillDemo("specialist")}
						disabled={busy}
					>
						\u062d\u0633\u0627\u0628 \u0645\u062a\u062e\u0635\u0635
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
				<BrandLockup subtitle="\u062b\u0628\u062a\u200c\u0646\u0627\u0645 \u0645\u0627\u062f\u0631" />
			</div>
			<div className="authx__head">
				<h1 className="authx__title">\u062b\u0628\u062a\u200c\u0646\u0627\u0645 \u0645\u0627\u062f\u0631</h1>
				<p className="authx__desc">
					\u062f\u0631 \u0686\u0646\u062f \u0645\u0631\u062d\u0644\u0647 \u06a9\u0648\u062a\u0627\u0647 \u062d\u0633\u0627\u0628 \u0634\u0645\u0627 \u0633\u0627\u062e\u062a\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f. \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u06cc\u0634\u062a\u0631 \u0631\u0627 \u0628\u0639\u062f\u0627\u064b \u062b\u0628\u062a \u0645\u06cc\u200c\u06a9\u0646\u06cc\u062f.
				</p>
			</div>

			{renderSteps()}

			{registerAlert ? <Alert tone="danger">{registerAlert}</Alert> : null}

			{step === 1 ? (
				<div className="authx__fields">
					<Field label="\u0646\u0627\u0645" error={errors.firstName}>
						<TextInput
							value={form.firstName}
							onChange={(value) => set({ firstName: value })}
							placeholder="\u0646\u0627\u0645 \u062e\u0648\u062f \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f"
							invalid={Boolean(errors.firstName)}
							disabled={busy}
						/>
					</Field>
					<Field label="\u0646\u0627\u0645 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc" error={errors.lastName}>
						<TextInput
							value={form.lastName}
							onChange={(value) => set({ lastName: value })}
							placeholder="\u0646\u0627\u0645 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc \u062e\u0648\u062f \u0631\u0627 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f"
							invalid={Boolean(errors.lastName)}
							disabled={busy}
						/>
					</Field>
					<Field
						label="\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644"
						hint="\u0628\u0627 \u0627\u06cc\u0646 \u0634\u0645\u0627\u0631\u0647 \u0648\u0627\u0631\u062f \u062d\u0633\u0627\u0628 \u0645\u06cc\u200c\u0634\u0648\u06cc\u062f."
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
						label="\u0631\u0645\u0632 \u0639\u0628\u0648\u0631"
						hint={`\u062d\u062f\u0627\u0642\u0644 ${toFa(String(MIN_PASSWORD_LENGTH))} \u06a9\u0627\u0631\u0627\u06a9\u062a\u0631.`}
						error={errors.password}
					>
						<PasswordInput
							value={form.password}
							onChange={(value) => set({ password: value })}
							placeholder="\u06cc\u06a9 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f"
							visible={showPassword}
							onToggleVisible={() => setShowPassword((value) => !value)}
							invalid={Boolean(errors.password)}
							disabled={busy}
						/>
					</Field>
					<Field label="\u062a\u06a9\u0631\u0627\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631" error={errors.confirm}>
						<PasswordInput
							value={form.confirm}
							onChange={(value) => set({ confirm: value })}
							placeholder="\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0631\u0627 \u062f\u0648\u0628\u0627\u0631\u0647 \u0648\u0627\u0631\u062f \u06a9\u0646\u06cc\u062f"
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
						label="\u062a\u0627\u0631\u06cc\u062e \u062a\u0648\u0644\u062f"
						hint="\u0648\u0627\u0631\u062f \u06a9\u0631\u062f\u0646 \u0627\u06cc\u0646 \u062a\u0627\u0631\u06cc\u062e \u0627\u062e\u062a\u06cc\u0627\u0631\u06cc \u0627\u0633\u062a."
						error={errors.birthDate}
					>
						<TextInput
							value={form.birthDate}
							onChange={(value) => set({ birthDate: value })}
							type="date"
							invalid={Boolean(errors.birthDate)}
							disabled={busy}
						/>
					</Field>
					<Field label="\u0648\u0636\u0639\u06cc\u062a \u0641\u0639\u0644\u06cc" error={errors.currentStatus}>
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
						label="\u062a\u0627\u0631\u06cc\u062e \u0634\u0631\u0648\u0639 \u0622\u062e\u0631\u06cc\u0646 \u0642\u0627\u0639\u062f\u06af\u06cc"
						hint="\u0627\u06af\u0631 \u0627\u06cc\u0646 \u062a\u0627\u0631\u06cc\u062e \u0631\u0627 \u0646\u0645\u06cc\u200c\u062f\u0627\u0646\u06cc\u062f\u060c \u062e\u0627\u0644\u06cc \u0628\u06af\u0630\u0627\u0631\u06cc\u062f \u0648 \u0628\u0639\u062f\u0627\u064b \u062b\u0628\u062a \u06a9\u0646\u06cc\u062f."
						error={errors.lmpDate}
					>
						<TextInput
							value={form.lmpDate}
							onChange={(value) => set({ lmpDate: value })}
							type="date"
							invalid={Boolean(errors.lmpDate)}
							disabled={busy}
						/>
					</Field>
					<Alert tone="info">
						\u062a\u0627\u0631\u06cc\u062e \u0627\u062d\u062a\u0645\u0627\u0644\u06cc \u0632\u0627\u06cc\u0645\u0627\u0646:{" "}
						{estimatedEdd ? formatDate(estimatedEdd) : NOT_RECORDED}
					</Alert>
				</div>
			) : null}

			{step === 4 ? (
				<div className="authx__summary">
					{renderSummaryRow(
						"\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u062d\u0633\u0627\u0628",
						[
							`\u0646\u0627\u0645 \u0648 \u0646\u0627\u0645 \u062e\u0627\u0646\u0648\u0627\u062f\u06af\u06cc: ${form.firstName.trim()} ${form.lastName.trim()}`,
							`\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06cc\u0644: ${toFa(normalizePhone(form.phone))}`,
						],
						1,
					)}
					{renderSummaryRow(
						"\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0645\u0627\u062f\u0631",
						[
							`\u062a\u0627\u0631\u06cc\u062e \u062a\u0648\u0644\u062f: ${form.birthDate ? formatDate(form.birthDate) : NOT_RECORDED}`,
							`\u0648\u0636\u0639\u06cc\u062a \u0641\u0639\u0644\u06cc: ${statusLabel}`,
						],
						2,
					)}
					{isPregnant
						? renderSummaryRow(
								"\u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0628\u0627\u0631\u062f\u0627\u0631\u06cc",
								[
									`\u0634\u0631\u0648\u0639 \u0622\u062e\u0631\u06cc\u0646 \u0642\u0627\u0639\u062f\u06af\u06cc: ${
										form.lmpDate ? formatDate(form.lmpDate) : NOT_RECORDED
									}`,
									`\u062a\u0627\u0631\u06cc\u062e \u0627\u062d\u062a\u0645\u0627\u0644\u06cc \u0632\u0627\u06cc\u0645\u0627\u0646: ${
										estimatedEdd ? formatDate(estimatedEdd) : NOT_RECORDED
									}`,
								],
								3,
							)
						: null}
					<span className="authx__foot">
						\u0627\u06cc\u0646 \u0627\u0637\u0644\u0627\u0639\u0627\u062a \u0641\u0642\u0637 \u062f\u0631 \u0647\u0645\u06cc\u0646 \u0645\u0631\u0648\u0631\u06af\u0631 \u0630\u062e\u06cc\u0631\u0647 \u0645\u06cc\u200c\u0634\u0648\u062f \u0648 \u0628\u0647 \u0647\u06cc\u0686 \u0633\u0631\u0648\u0631\u06cc \u0627\u0631\u0633\u0627\u0644 \u0646\u0645\u06cc\u200c\u0634\u0648\u062f.
					</span>
				</div>
			) : null}

			<div className="authx__actions">
				<Button type="submit" variant="primary" block loading={busy}>
					{step === 4
						? "\u0627\u06cc\u062c\u0627\u062f \u062d\u0633\u0627\u0628"
						: "\u0627\u062f\u0627\u0645\u0647"}
				</Button>
				<Button variant="outline" block onClick={() => backFrom(step)} disabled={busy}>
					{steps.indexOf(step) === 0
						? "\u0628\u0627\u0632\u06af\u0634\u062a \u0628\u0647 \u0648\u0631\u0648\u062f"
						: "\u0645\u0631\u062d\u0644\u0647 \u0642\u0628\u0644"}
				</Button>
			</div>

			<div className="authx__switch">
				<span>\u062d\u0633\u0627\u0628 \u06a9\u0627\u0631\u0628\u0631\u06cc \u062f\u0627\u0631\u06cc\u062f\u061f</span>
				<Button variant="ghost" size="sm" onClick={goLogin} disabled={busy}>
					\u0648\u0627\u0631\u062f \u0634\u0648\u06cc\u062f
				</Button>
			</div>
		</form>
	)

	const successView = (
		<div className="authx__form">
			<div className="authx__mobile-brand">
				<BrandLockup subtitle="\u062b\u0628\u062a\u200c\u0646\u0627\u0645 \u0645\u0627\u062f\u0631" />
			</div>
			<div className="authx__success">
				<span className="authx__success-icon" aria-hidden="true">
					<Icon name="check" size={24} />
				</span>
				<div className="authx__head">
					<h1 className="authx__title">
						\u062d\u0633\u0627\u0628 \u0634\u0645\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u0627\u06cc\u062c\u0627\u062f \u0634\u062f
					</h1>
					<p className="authx__desc">
						\u0627\u06a9\u0646\u0648\u0646 \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u06cc\u062f \u0648\u0627\u0631\u062f \u0641\u0636\u0627\u06cc \u0645\u0631\u0627\u0642\u0628\u062a \u0634\u062e\u0635\u06cc \u062e\u0648\u062f \u0634\u0648\u06cc\u062f.
					</p>
				</div>
				<Button variant="primary" block onClick={() => void enterAfterRegister()}>
					\u0648\u0631\u0648\u062f \u0628\u0647 \u062d\u0633\u0627\u0628
				</Button>
				<span className="authx__foot">
					\u0627\u06cc\u0646 \u062d\u0633\u0627\u0628 \u0646\u0645\u0627\u06cc\u0634\u06cc \u0627\u0633\u062a \u0648 \u062a\u0627 \u0632\u0645\u0627\u0646\u06cc \u06a9\u0647 \u062f\u0627\u062f\u0647 \u0646\u0645\u0627\u06cc\u0634\u06cc \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06cc \u0646\u0634\u0648\u062f \u062f\u0631 \u0647\u0645\u06cc\u0646 \u0645\u0631\u0648\u0631\u06af\u0631 \u0628\u0627\u0642\u06cc \u0645\u06cc\u200c\u0645\u0627\u0646\u062f.
				</span>
			</div>
		</div>
	)

	return (
		<div className="authx">
			<div className="authx__card">
				<aside className="authx__brand">
					<BrandLockup subtitle="\u0645\u0631\u0627\u0642\u0628\u062a \u06cc\u06a9\u067e\u0627\u0631\u0686\u0647 \u0645\u0627\u062f\u0631 \u0648 \u06a9\u0648\u062f\u06a9" />
					<div>
						<h2 className="authx__headline">
							\u067e\u06cc\u06af\u06cc\u0631\u06cc \u0622\u0631\u0627\u0645 \u0648 \u0645\u0646\u0637\u0642\u0645 \u0633\u0644\u0627\u0645\u062a \u0645\u0627\u062f\u0631 \u0648 \u06a9\u0648\u062f\u06a9
						</h2>
						<p className="authx__lede">
							\u0647\u0631 \u0686\u06cc\u0632\u06cc \u06a9\u0647 \u062b\u0628\u062a \u0645\u06cc\u200c\u06a9\u0646\u06cc\u062f \u062f\u0631 \u062c\u0627\u06cc \u062e\u0648\u062f\u0634 \u0628\u0627\u0642\u06cc \u0645\u06cc\u200c\u0645\u0627\u0646\u062f: \u0628\u0627\u0631\u062f\u0627\u0631\u06cc\u060c \u06a9\u0648\u062f\u06a9 \u0648 \u067e\u0631\u0648\u0646\u062f\u0647 \u062e\u0648\u062f \u0645\u0627\u062f\u0631 \u062c\u062f\u0627\u06af\u0627\u0646\u0647 \u0646\u06af\u0647\u062f\u0627\u0631\u06cc \u0645\u06cc\u200c\u0634\u0648\u0646\u062f.
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
						\u0627\u06cc\u0646 \u0646\u0633\u062e\u0647 \u0646\u0645\u0627\u06cc\u0634\u06cc \u0627\u0633\u062a\u061b \u0627\u062d\u0631\u0627\u0632 \u0647\u0648\u06cc\u062a \u0648\u0627\u0642\u0639\u06cc\u060c \u067e\u06cc\u0627\u0645\u06a9 \u06cc\u0627 \u0633\u0631\u0648\u0631\u06cc \u062f\u0631 \u0627\u06cc\u0646 \u0645\u0631\u062d\u0644\u0647 \u0648\u062c\u0648\u062f \u0646\u062f\u0627\u0631\u062f.
					</p>
				</aside>
				<section className="authx__pane">
					{mode === "login" ? loginView : mode === "register" ? registerView : successView}
				</section>
			</div>
		</div>
	)
}
