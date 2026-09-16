import { useState } from "react"
import { useData } from "../../app/providers/DataProvider"
import {
	Alert,
	Badge,
	Button,
	Card,
	EmptyState,
	Field,
	FormRow,
	Modal,
	PageHeader,
} from "../../shared/components/ui"
import { useMotherContext } from "./useMotherContext"
import { getPregnancies } from "../../services/selectors"
import { createPregnancy, recordBirth, updatePregnancy } from "../../services/mutations"
import {
	BIRTH_KIND_LABELS,
	NOT_RECORDED,
	PREGNANCY_STATUS_LABELS,
	PREGNANCY_STATUS_TONES,
} from "../../shared/constants/labels"
import type { Birth, Child } from "../../shared/types/domain"
import { formatDate, formatGestation, gestation, todayIso } from "../../shared/utils/date"

export function PregnanciesPage() {
	const { db, motherId } = useMotherContext()
	const { mutate } = useData()
	const pregnancies = getPregnancies(db, motherId)
	const [error, setError] = useState<string | null>(null)
	const [newForm, setNewForm] = useState({ label: "", lmpDate: "", eddDate: "", note: "" })
	const [birthFor, setBirthFor] = useState<string | null>(null)
	const [birthForm, setBirthForm] = useState({
		date: todayIso(),
		time: "",
		kind: "natural" as NonNullable<Birth["kind"]>,
		place: "",
		childName: "",
		sex: "unknown" as Child["sex"],
	})

	const submitNew = () => {
		if (!newForm.label.trim()) {
			setError("عنوان پرونده بارداری الزامی است.")
			return
		}
		const status = newForm.lmpDate || newForm.eddDate ? "active" : "planning"
		setError(null)
		void mutate((current) =>
			createPregnancy(current, {
				motherId,
				label: newForm.label.trim(),
				status,
				lmpDate: newForm.lmpDate || null,
				eddDate: newForm.eddDate || null,
				motherNote: newForm.note.trim() || undefined,
			}),
		)
			.then(() => setNewForm({ label: "", lmpDate: "", eddDate: "", note: "" }))
			.catch((cause: unknown) =>
				setError(cause instanceof Error ? cause.message : "ثبت بارداری ناموفق بود."),
			)
	}

	const submitBirth = () => {
		if (!birthFor) return
		if (!birthForm.childName.trim()) {
			setError("نام کودک را وارد کنید.")
			return
		}
		const birth: Birth = {
			date: birthForm.date,
			time: birthForm.time || undefined,
			kind: birthForm.kind,
			place: birthForm.place.trim() || undefined,
		}
		setError(null)
		void mutate((current) =>
			recordBirth(current, birthFor, {
				birth,
				childName: birthForm.childName.trim(),
				sex: birthForm.sex,
			}),
		).then(() => setBirthFor(null))
	}

	return (
		<>
			<PageHeader
				title="بارداری‌ها"
				subtitle="چرخه پیش از بارداری ← بارداری ← زایمان ← پرونده کودک"
			/>

			{error && <Alert tone="danger">{error}</Alert>}

			<Card title="پرونده‌های بارداری">
				{pregnancies.length === 0 ? (
					<EmptyState title="پرونده بارداری ثبت نشده است." hint="می‌توانید از فرم پایین پرونده جدید بسازید." />
				) : (
					<ul className="list">
						{pregnancies.map((pregnancy) => {
							const gest = gestation({ lmpDate: pregnancy.lmpDate, eddDate: pregnancy.eddDate })
							return (
								<li key={pregnancy.id} className="list__item list__item--stack">
									<div>
										<div className="row-head">
											<strong>{pregnancy.label}</strong>
											<Badge tone={PREGNANCY_STATUS_TONES[pregnancy.status]}>
												{PREGNANCY_STATUS_LABELS[pregnancy.status]}
											</Badge>
										</div>
										<dl className="pairs">
											<div>
												<dt>هفته بارداری</dt>
												<dd>{pregnancy.status === "active" ? formatGestation(gest) : NOT_RECORDED}</dd>
											</div>
											<div>
												<dt>اولین روز آخرین قاعدگی</dt>
												<dd>{pregnancy.lmpDate ? formatDate(pregnancy.lmpDate) : NOT_RECORDED}</dd>
											</div>
											<div>
												<dt>تاریخ تخمینی زایمان</dt>
												<dd>
													{pregnancy.eddDate
														? formatDate(pregnancy.eddDate)
														: gest
															? `${formatDate(gest.eddDate)} (تخمینی)`
															: NOT_RECORDED}
												</dd>
											</div>
											{pregnancy.birth && (
												<div>
													<dt>زایمان</dt>
													<dd>
														{formatDate(pregnancy.birth.date)}
														{pregnancy.birth.kind ? ` — ${BIRTH_KIND_LABELS[pregnancy.birth.kind]}` : ""}
													</dd>
												</div>
											)}
										</dl>
										{pregnancy.motherNote && <p>یادداشت من: {pregnancy.motherNote}</p>}
										{pregnancy.providerNote && (
											<p className="muted">یادداشت مراقب سلامت: {pregnancy.providerNote}</p>
										)}
									</div>
									<div className="row-actions">
										{pregnancy.status === "planning" && (
											<Button
												onClick={() => {
													setError(null)
													void mutate((current) =>
														updatePregnancy(current, pregnancy.id, { status: "active" }),
													).catch((cause: unknown) =>
														setError(cause instanceof Error ? cause.message : "تغییر وضعیت ناموفق بود."),
													)
												}}
											>
												شروع بارداری
											</Button>
										)}
										{pregnancy.status === "active" && (
											<Button variant="primary" onClick={() => setBirthFor(pregnancy.id)}>
												ثبت زایمان
											</Button>
										)}
									</div>
								</li>
							)
						})}
					</ul>
				)}
			</Card>

			<Card title="ثبت پرونده بارداری جدید" subtitle="اگر تاریخی وارد نکنید، پرونده در مرحله پیش از بارداری ثبت می‌شود.">
				<Field label="عنوان">
					<input
						className="input"
						value={newForm.label}
						placeholder="مانند: بارداری سوم"
						onChange={(event) => setNewForm({ ...newForm, label: event.target.value })}
					/>
				</Field>
				<FormRow>
					<Field label="اولین روز آخرین قاعدگی" hint="اختیاری">
						<input
							className="input"
							type="date"
							value={newForm.lmpDate}
							onChange={(event) => setNewForm({ ...newForm, lmpDate: event.target.value })}
						/>
					</Field>
					<Field label="تاریخ تخمینی زایمان" hint="اختیاری">
						<input
							className="input"
							type="date"
							value={newForm.eddDate}
							onChange={(event) => setNewForm({ ...newForm, eddDate: event.target.value })}
						/>
					</Field>
				</FormRow>
				<Field label="یادداشت" hint="اختیاری">
					<textarea
						className="input input--area"
						value={newForm.note}
						onChange={(event) => setNewForm({ ...newForm, note: event.target.value })}
					/>
				</Field>
				<Button variant="primary" onClick={submitNew}>
					ثبت پرونده
				</Button>
			</Card>

			<Modal open={birthFor !== null} title="ثبت زایمان و پرونده کودک" onClose={() => setBirthFor(null)}>
				<FormRow>
					<Field label="تاریخ زایمان">
						<input
							className="input"
							type="date"
							value={birthForm.date}
							onChange={(event) => setBirthForm({ ...birthForm, date: event.target.value })}
						/>
					</Field>
					<Field label="ساعت" hint="اختیاری">
						<input
							className="input"
							type="time"
							value={birthForm.time}
							onChange={(event) => setBirthForm({ ...birthForm, time: event.target.value })}
						/>
					</Field>
				</FormRow>
				<FormRow>
					<Field label="نوع زایمان">
						<select
							className="input"
							value={birthForm.kind}
							onChange={(event) =>
								setBirthForm({ ...birthForm, kind: event.target.value as NonNullable<Birth["kind"]> })
							}
						>
							<option value="natural">{BIRTH_KIND_LABELS.natural}</option>
							<option value="cesarean">{BIRTH_KIND_LABELS.cesarean}</option>
							<option value="unknown">{BIRTH_KIND_LABELS.unknown}</option>
						</select>
					</Field>
					<Field label="محل زایمان" hint="اختیاری">
						<input
							className="input"
							value={birthForm.place}
							onChange={(event) => setBirthForm({ ...birthForm, place: event.target.value })}
						/>
					</Field>
				</FormRow>
				<FormRow>
					<Field label="نام کودک">
						<input
							className="input"
							value={birthForm.childName}
							onChange={(event) => setBirthForm({ ...birthForm, childName: event.target.value })}
						/>
					</Field>
					<Field label="جنسیت">
						<select
							className="input"
							value={birthForm.sex}
							onChange={(event) => setBirthForm({ ...birthForm, sex: event.target.value as Child["sex"] })}
						>
							<option value="female">دختر</option>
							<option value="male">پسر</option>
							<option value="unknown">ثبت نشده</option>
						</select>
					</Field>
				</FormRow>
				<Button variant="primary" onClick={submitBirth}>
					ثبت و ساخت پرونده کودک
				</Button>
			</Modal>
		</>
	)
}
