import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useData } from "../../app/providers/DataProvider"
import { useSession } from "../../app/providers/SessionProvider"
import type { Role } from "../../shared/types/domain"
import { ROLE_LABELS } from "../../shared/constants/labels"
import { Alert, Button, Card, Field, Spinner } from "../../shared/components/ui"
import { motherFullName } from "../../services/selectors"

/** ورود دمو: انتخاب نقش و پرونده، بدون احراز هویت واقعی. */
export function LoginPage() {
	const { db, loading } = useData()
	const { session, signIn } = useSession()
	const navigate = useNavigate()
	const [role, setRole] = useState<Role>("mother")
	const [motherId, setMotherId] = useState("")
	const [providerId, setProviderId] = useState("")

	useEffect(() => {
		if (session) navigate(`/${session.role}`, { replace: true })
	}, [session, navigate])

	useEffect(() => {
		if (!db) return
		if (role === "mother") setMotherId((current) => current || db.mothers[0]?.id || "")
		else {
			const first = db.providers.find((p) => p.role === role)
			setProviderId(first?.id ?? "")
		}
	}, [db, role])

	if (loading || !db) return <Spinner />

	const providers = db.providers.filter((p) => p.role === role)

	const submit = () => {
		if (role === "mother") {
			const mother = db.mothers.find((m) => m.id === motherId)
			if (!mother) return
			void signIn({
				role,
				motherId: mother.id,
				displayName: motherFullName(mother),
			}).then(() => navigate("/mother", { replace: true }))
			return
		}
		const provider = db.providers.find((p) => p.id === providerId)
		if (!provider) return
		void signIn({
			role,
			providerId: provider.id,
			displayName: provider.name,
		}).then(() => navigate(`/${role}`, { replace: true }))
	}

	return (
		<div className="login">
			<Card
				title="ورود به سامانه مراقبت مادر و کودک"
				subtitle="این نسخه نمایشی است؛ ورود فقط با انتخاب نقش انجام می‌شود."
			>
				<Alert tone="info">
					احراز هویت واقعی، رمز عبور و پیامک تأیید در این نسخه پیاده‌سازی نشده است. داده‌ها فقط در مرورگر شما ذخیره می‌شوند.
				</Alert>

				<Field label="نقش">
					<select className="input" value={role} onChange={(event) => setRole(event.target.value as Role)}>
						<option value="mother">{ROLE_LABELS.mother}</option>
						<option value="midwife">{ROLE_LABELS.midwife}</option>
						<option value="specialist">{ROLE_LABELS.specialist}</option>
					</select>
				</Field>

				{role === "mother" ? (
					<Field label="پرونده مادر" hint="برای بررسی حالت‌های مختلف، پرونده‌های متنوعی در داده دمو وجود دارد.">
						<select className="input" value={motherId} onChange={(event) => setMotherId(event.target.value)}>
							{db.mothers.map((mother) => (
								<option key={mother.id} value={mother.id}>
									{motherFullName(mother)}
								</option>
							))}
						</select>
					</Field>
				) : (
					<Field label="مراقب سلامت">
						<select
							className="input"
							value={providerId}
							onChange={(event) => setProviderId(event.target.value)}
						>
							{providers.map((provider) => (
								<option key={provider.id} value={provider.id}>
									{provider.name}
									{provider.specialty ? ` — ${provider.specialty}` : ""}
								</option>
							))}
						</select>
					</Field>
				)}

				<Button variant="primary" onClick={submit}>
					ورود به پنل
				</Button>
			</Card>
		</div>
	)
}
