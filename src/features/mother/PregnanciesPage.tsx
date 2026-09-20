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
	Select,
	TextArea,
	TextInput,
} from "../../shared/components/ui"
import { JalaliDateInput } from "../../shared/components/DateInput"
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
			<PageHeader title="بارداری‌ها" subtitle="چرخه پیش از بارداری ← بارداری ← زایمان ← پرونده کودک" />

			{error && <Alert tone="danger">{error}</Alert>}

			<Card title="پرونده‌های بارداری">
				{pregnancies.length === 0 ? (
					<EmptyState
						icon="pregnancy"
						title="پرونده بارداری ثبت نشده است"
						hint="از فرم پایین می‌توانید پرونده جدید بسازید. در هر زمان فقط یک بارداری می‌تواند فعال باشد."
					/>
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
												variant="outline"
												size="sm"
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
											<Button variant="primary" size="sm" onClick={() => setBirthFor(pregnancy.id)}>
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

			<Card
				title="ثبت پرونده بارداری جدید"
				subtitle="اگر تاریخی وارد نکنید، پرونده در مرحله پیش از بارداری ثبت می‌شود."
			>
				<Field label="عنوان">
					<TextInput
						value={newForm.label}
						placeholder="مانند: بارداری سوم"
						onChange={(value) => setNewForm({ ...newForm, label: value })}
					/>
				</Field>
				<FormRow>
					<Field label="اولین روز آخرین قاعدگی (شمسی)" hint="اختیاری">
						<JalaliDateInput
							value={newForm.lmpDate}
							yearsBack={2}
							yearsAhead={0}
							onChange={(value) => setNewForm({ ...newForm, lmpDate: value })}
						/>
					</Field>
					<Field label="تاریخ تخمینی زایمان (شمسی)" hint="اختیاری">
						<JalaliDateInput
							value={newForm.eddDate}
							yearsBack={1}
							yearsAhead={2}
							onChange={(value) => setNewForm({ ...newForm, eddDate: value })}
						/>
					</Field>
				</FormRow>
				<Field label="یادداشت" hint="اختیاری">
					<TextArea
						value={newForm.note}
						onChange={(value) => setNewForm({ ...newForm, note: value })}
					/>
				</Field>
				<Button variant="primary" icon="plus" onClick={submitNew}>
					ثبت پرونده
				</Button>
			</Card>

			<Modal
				open={birthFor !== null}
				title="ثبت زایمان و پرونده کودک"
				onClose={() => setBirthFor(null)}
				footer={
					<>
						<Button variant="outline" onClick={() => setBirthFor(null)}>
							انصراف
						</Button>
						<Button variant="primary" onClick={submitBirth}>
							ثبت و ساخت پرونده کودک
						</Button>
					</>
				}
			>
				<FormRow>
					<Field label="تاریخ زایمان (شمسی)">
						<JalaliDateInput
							value={birthForm.date}
							yearsBack={2}
							yearsAhead={0}
							onChange={(value) => setBirthForm({ ...birthForm, date: value })}
						/>
					</Field>
					<Field label="ساعت" hint="اختیاری">
						<TextInput
							type="time"
							value={birthForm.time}
							onChange={(value) => setBirthForm({ ...birthForm, time: value })}
						/>
					</Field>
				</FormRow>
				<FormRow>
					<Field label="نوع زایمان">
						<Select
							value={birthForm.kind}
							onChange={(value) =>
								setBirthForm({ ...birthForm, kind: value as NonNullable<Birth["kind"]> })
							}
							options={[
								{ value: "natural", label: BIRTH_KIND_LABELS.natural },
								{ value: "cesarean", label: BIRTH_KIND_LABELS.cesarean },
								{ value: "unknown", label: BIRTH_KIND_LABELS.unknown },
							]}
						/>
					</Field>
					<Field label="محل زایمان" hint="اختیاری">
						<TextInput
							value={birthForm.place}
							onChange={(value) => setBirthForm({ ...birthForm, place: value })}
						/>
					</Field>
				</FormRow>
				<FormRow>
					<Field label="نام کودک">
						<TextInput
							value={birthForm.childName}
							onChange={(value) => setBirthForm({ ...birthForm, childName: value })}
						/>
					</Field>
					<Field label="جنسیت">
						<Select
							value={birthForm.sex}
							onChange={(value) => setBirthForm({ ...birthForm, sex: value as Child["sex"] })}
							options={[
								{ value: "female", label: "دختر" },
								{ value: "male", label: "پسر" },
								{ value: "unknown", label: "ثبت نشده" },
							]}
						/>
					</Field>
				</FormRow>
			</Modal>
		</>
	)
}
