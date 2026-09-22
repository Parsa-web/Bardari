import { useState } from "react"
import {
	Alert,
	Badge,
	Button,
	Card,
	Field,
	PageHeader,
	Select,
	TextArea,
	TextInput,
} from "../../shared/components/ui"
import { JalaliDateInput } from "../../shared/components/DateInput"
import { CareRecordList } from "./components/CareRecordList"
import type { CareRecordItem } from "./components/CareRecordList"
import { careActions } from "./careStore"
import { useCare } from "./useCare"
import { useData } from "../../app/providers/DataProvider"
import { getChildren } from "../../services/selectors"
import { addChild } from "../../services/mutations"
import { useSelectedChild } from "../../shared/hooks/useSelectedChild"
import { SEX_LABELS } from "../../shared/constants/labels"
import { formatAge, formatDate, todayIso } from "../../shared/utils/date"
import "./care.css"

/** داروها با کاما، کامای فارسی یا خط جدید جدا می‌شوند. */
function parseMedications(value: string): string[] {
	return value
		.split(/[,\u060c\n]/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
}

const EMPTY_RECORD = {
	illness: "",
	diagnosis: "",
	treatment: "",
	medications: "",
	doctorNotes: "",
	startDate: todayIso(),
	endDate: "",
}

const EMPTY_CHILD = { name: "", birthDate: todayIso(), sex: "female" as "female" | "male" }

/**
 * سابقه سلامت کودک.
 * این صفحه پایگاه کودک جداگانه‌ای ندارد؛ همان رکورد کانونی کودک در بخش کودکان استفاده می‌شود.
 */
export function ChildHealthPage() {
	const { db, care, motherId } = useCare()
	const { mutate } = useData()
	const children = getChildren(db, motherId)
	const { child, childId, selectChild, options } = useSelectedChild(children)
	const [form, setForm] = useState(EMPTY_RECORD)
	const [childForm, setChildForm] = useState(EMPTY_CHILD)
	const [showChildForm, setShowChildForm] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const records = care.medicalRecords
		.filter((item) => item.childId === childId)
		.sort((a, b) => b.startDate.localeCompare(a.startDate))

	const items: CareRecordItem[] = records.map((item) => ({
		id: item.id,
		title: item.illness,
		badge: (
			<Badge tone={item.endDate ? "success" : "warn"}>{item.endDate ? "پایان‌یافته" : "در جریان"}</Badge>
		),
		meta: item.endDate
			? `${formatDate(item.startDate)} تا ${formatDate(item.endDate)}`
			: `از ${formatDate(item.startDate)}`,
		accent: item.endDate ? "done" : "due",
		body: (
			<div className="care-stack">
				{item.diagnosis && <div>تشخیص پزشک: {item.diagnosis}</div>}
				{item.treatment && <div>درمان انجام‌شده: {item.treatment}</div>}
				{item.medicationList.length > 0 && <div>داروها: {item.medicationList.join("، ")}</div>}
				{item.doctorNotes && <div>توضیح پزشک: {item.doctorNotes}</div>}
			</div>
		),
		actions: (
			<Button variant="ghost" size="sm" onClick={() => careActions.deleteMedicalRecord(item.id)}>
				حذف
			</Button>
		),
	}))

	const submitRecord = () => {
		setNotice(null)
		if (!childId) return setError("ابتدا کودک را انتخاب یا ثبت کنید.")
		if (!form.illness.trim()) return setError("نام بیماری را وارد کنید.")
		if (!form.startDate) return setError("تاریخ شروع را انتخاب کنید.")
		if (form.endDate && form.endDate < form.startDate)
			return setError("تاریخ پایان نمی‌تواند پیش از تاریخ شروع باشد.")
		careActions.addMedicalRecord({
			childId,
			illness: form.illness.trim(),
			diagnosis: form.diagnosis.trim(),
			treatment: form.treatment.trim(),
			medicationList: parseMedications(form.medications),
			doctorNotes: form.doctorNotes.trim(),
			startDate: form.startDate,
			endDate: form.endDate,
		})
		setForm({ ...EMPTY_RECORD, startDate: form.startDate })
		setError(null)
		setNotice("سابقه سلامت ثبت شد.")
		return undefined
	}

	const submitChild = () => {
		setNotice(null)
		if (!childForm.name.trim()) return setError("نام کودک را وارد کنید.")
		if (!childForm.birthDate) return setError("تاریخ تولد کودک را انتخاب کنید.")
		void mutate((current) =>
			addChild(current, {
				motherId,
				name: childForm.name.trim(),
				birthDate: childForm.birthDate,
				sex: childForm.sex,
			}),
		).then(() => {
			setChildForm(EMPTY_CHILD)
			setShowChildForm(false)
			setNotice("پرونده کودک ثبت شد و در همه بخش‌های کودک در دسترس است.")
		})
		setError(null)
		return undefined
	}

	return (
		<div className="care-stack">
			<PageHeader title="سلامت کودک" subtitle="ثبت سابقه بیماری، درمان و داروهای تجویزشده" />

			<Alert tone="info">
				این بخش فقط برای ثبت سابقه است و سامانه دارو یا درمان توصیه نمی‌کند.
			</Alert>

			{error && <Alert tone="danger">{error}</Alert>}
			{notice && <Alert tone="success">{notice}</Alert>}

			<Card
				title="کودک انتخاب‌شده"
				subtitle="همین کودک در بخش کودکان، رشد، واکسن و مراحل تحول نیز انتخاب می‌ماند"
			>
				{children.length === 0 ? (
					<Alert tone="info">
						هنوز پرونده کودکی ثبت نشده است. پرونده کودک معمولاً پس از ثبت زایمان ساخته می‌شود.
					</Alert>
				) : (
					<div className="care-form">
						<Field label="کودک">
							<Select value={childId} onChange={selectChild} options={options} />
						</Field>
						{child && (
							<div className="care-provider">
								<div>
									<strong>{child.name}</strong>
									<p className="care-list__meta">
										{SEX_LABELS[child.sex]} · {formatDate(child.birthDate)} · {formatAge(child.birthDate)}
									</p>
								</div>
							</div>
						)}
					</div>
				)}
				<div className="care-form__actions">
					<Button variant="outline" size="sm" onClick={() => setShowChildForm(!showChildForm)}>
						{showChildForm ? "بستن فرم ثبت کودک" : "ثبت پرونده کودک جدید"}
					</Button>
				</div>
				{showChildForm && (
					<div className="care-form">
						<Field label="نام کودک">
							<TextInput
								value={childForm.name}
								onChange={(value) => setChildForm({ ...childForm, name: value })}
							/>
						</Field>
						<Field label="تاریخ تولد (شمسی)">
							<JalaliDateInput
								value={childForm.birthDate}
								onChange={(value) => setChildForm({ ...childForm, birthDate: value })}
								yearsBack={10}
								yearsAhead={0}
							/>
						</Field>
						<Field label="جنسیت">
							<Select
								value={childForm.sex}
								onChange={(value) => setChildForm({ ...childForm, sex: value as "female" | "male" })}
								options={[
									{ value: "female", label: SEX_LABELS.female },
									{ value: "male", label: SEX_LABELS.male },
								]}
							/>
						</Field>
						<div className="care-form__actions">
							<Button variant="primary" icon="plus" onClick={submitChild}>
								ثبت کودک
							</Button>
						</div>
						<p className="care-note care-form__wide">
							کودک ثبت‌شده همان پرونده رسمی است و در بخش کودکان نیز نمایش داده می‌شود.
						</p>
					</div>
				)}
			</Card>

			<Card title="ثبت سابقه جدید">
				<div className="care-form">
					<Field label="بیماری">
						<TextInput
							value={form.illness}
							onChange={(value) => setForm({ ...form, illness: value })}
							placeholder="مانند سرماخوردگی"
						/>
					</Field>
					<Field label="تشخیص پزشک">
						<TextInput
							value={form.diagnosis}
							onChange={(value) => setForm({ ...form, diagnosis: value })}
						/>
					</Field>
					<Field label="تاریخ شروع (شمسی)">
						<JalaliDateInput
							value={form.startDate}
							onChange={(value) => setForm({ ...form, startDate: value })}
							yearsBack={5}
							yearsAhead={0}
						/>
					</Field>
					<Field label="تاریخ پایان (اختیاری)">
						<JalaliDateInput
							value={form.endDate}
							onChange={(value) => setForm({ ...form, endDate: value })}
							yearsBack={5}
							yearsAhead={1}
						/>
					</Field>
					<div className="care-form__wide">
						<Field label="درمان انجام‌شده">
							<TextArea
								value={form.treatment}
								onChange={(value) => setForm({ ...form, treatment: value })}
							/>
						</Field>
					</div>
					<div className="care-form__wide">
						<Field label="داروهای تجویزشده (با کاما یا خط جدید جدا کنید)">
							<TextArea
								value={form.medications}
								onChange={(value) => setForm({ ...form, medications: value })}
								placeholder="مثال: استامینوفن، قطره آهن"
							/>
						</Field>
					</div>
					<div className="care-form__wide">
						<Field label="توضیح پزشک">
							<TextArea
								value={form.doctorNotes}
								onChange={(value) => setForm({ ...form, doctorNotes: value })}
							/>
						</Field>
					</div>
					<div className="care-form__actions">
						<Button variant="primary" icon="check" onClick={submitRecord}>
							ثبت سابقه
						</Button>
					</div>
				</div>
			</Card>

			<Card title="سابقه ثبت‌شده">
				<CareRecordList
					items={items}
					emptyTitle="برای این کودک سابقه‌ای ثبت نشده است."
					emptyHint="بیماری، درمان و داروهای کودک را از فرم بالا ثبت کنید."
				/>
			</Card>
		</div>
	)
}
