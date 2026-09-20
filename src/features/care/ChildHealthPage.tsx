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
import { useMotherContext } from "../mother/useMotherContext"
import { careActions, ownedBy, useCareState } from "./careStore"
import { formatAge, formatDate, todayIso } from "../../shared/utils/date"
import "./care.css"

function parseMedications(raw: string): string[] {
	return raw
		.split(/[,\u060c\n]/)
		.map((item) => item.trim())
		.filter((item) => item.length > 0)
}

/** پرونده سلامت کودک پس از تولد: بیماری، درمان و داروهای تجویزشده. */
export function ChildHealthPage() {
	const { motherId } = useMotherContext()
	const care = useCareState()
	const children = ownedBy(care.children, motherId)
	const [selectedChildId, setSelectedChildId] = useState<string>("")
	const [childForm, setChildForm] = useState({ name: "", birthDate: "" })
	const [form, setForm] = useState({
		illness: "",
		diagnosis: "",
		treatment: "",
		medications: "",
		doctorNotes: "",
		startDate: todayIso(),
		endDate: "",
	})
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<string | null>(null)

	const activeChildId = selectedChildId || children[0]?.id || ""
	const activeChild = children.find((child) => child.id === activeChildId) ?? null
	const records = care.medicalRecords
		.filter((record) => record.childId === activeChildId)
		.sort((a, b) => b.startDate.localeCompare(a.startDate))

	const items: CareRecordItem[] = records.map((record) => ({
		id: record.id,
		title: record.illness,
		badge: <Badge tone={record.endDate ? "success" : "warn"}>{record.endDate ? "پایان‌یافته" : "در جریان"}</Badge>,
		meta: record.endDate
			? `از ${formatDate(record.startDate)} تا ${formatDate(record.endDate)}`
			: `از ${formatDate(record.startDate)}`,
		accent: record.endDate ? "done" : "due",
		body: (
			<>
				{record.diagnosis && <p>تشخیص: {record.diagnosis}</p>}
				{record.treatment && <p>درمان: {record.treatment}</p>}
				{record.medicationList.length > 0 && <p>داروهای ثبت‌شده: {record.medicationList.join(" ، ")}</p>}
				{record.doctorNotes && <p>یادداشت پزشک: {record.doctorNotes}</p>}
			</>
		),
		actions: (
			<Button variant="ghost" size="sm" onClick={() => careActions.deleteMedicalRecord(record.id)}>
				حذف
			</Button>
		),
	}))

	const submitChild = () => {
		setNotice(null)
		if (!childForm.name.trim()) return setError("نام کودک را وارد کنید.")
		if (!childForm.birthDate) return setError("تاریخ تولد کودک را انتخاب کنید.")
		const id = careActions.addChild({
			motherId,
			name: childForm.name.trim(),
			birthDate: childForm.birthDate,
		})
		setSelectedChildId(id)
		setChildForm({ name: "", birthDate: "" })
		setError(null)
		setNotice("پرونده کودک ایجاد شد.")
		return undefined
	}

	const submitRecord = () => {
		setNotice(null)
		if (!activeChildId) return setError("اول یک پرونده کودک ایجاد یا انتخاب کنید.")
		if (!form.illness.trim()) return setError("نام بیماری را وارد کنید.")
		if (!form.startDate) return setError("تاریخ شروع را انتخاب کنید.")
		if (form.endDate && form.endDate < form.startDate)
			return setError("تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.")
		careActions.addMedicalRecord({
			childId: activeChildId,
			illness: form.illness.trim(),
			diagnosis: form.diagnosis.trim(),
			treatment: form.treatment.trim(),
			medicationList: parseMedications(form.medications),
			doctorNotes: form.doctorNotes.trim(),
			startDate: form.startDate,
			endDate: form.endDate,
		})
		setForm({
			illness: "",
			diagnosis: "",
			treatment: "",
			medications: "",
			doctorNotes: "",
			startDate: todayIso(),
			endDate: "",
		})
		setError(null)
		setNotice("سابقه سلامت کودک ثبت شد.")
		return undefined
	}

	return (
		<div className="care-stack">
			<PageHeader title="سلامت کودک" subtitle="ثبت بیماری، درمان و داروهای تجویزشده پس از تولد" />

			<Alert tone="info">
				این بخش فقط سیستم ثبت سابقه است. سامانه هیچ دارو یا درمانی توصیه نمی‌کند؛ داروها فقط طبق تجویز پزشک
				توسط والدین یا پزشک ثبت می‌شوند.
			</Alert>

			{error && <Alert tone="danger">{error}</Alert>}
			{notice && <Alert tone="success">{notice}</Alert>}

			<Card title="پرونده کودک">
				{children.length > 0 ? (
					<div className="care-form">
						<Field label="انتخاب کودک">
							<Select
								value={activeChildId}
								onChange={setSelectedChildId}
								options={children.map((child) => ({ value: child.id, label: child.name }))}
							/>
						</Field>
						{activeChild && (
							<Field label="خلاصه">
								<p className="care-list__meta">
									تاریخ تولد: {formatDate(activeChild.birthDate)} · سن: {formatAge(activeChild.birthDate)}
								</p>
							</Field>
						)}
					</div>
				) : (
					<Alert tone="info">هنوز پرونده کودکی ثبت نشده است. از فرم پایین یک پرونده بسازید.</Alert>
				)}

				<div className="care-form">
					<Field label="نام کودک جدید">
						<TextInput
							value={childForm.name}
							onChange={(value) => setChildForm({ ...childForm, name: value })}
							placeholder="نام کودک"
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
					<div className="care-form__actions">
						<Button variant="secondary" icon="child" onClick={submitChild}>
							ایجاد پرونده کودک
						</Button>
					</div>
				</div>
			</Card>

			<Card title="سابقه بیماری و درمان">
				<CareRecordList
					items={items}
					emptyTitle="سابقه سلامتی برای این کودک ثبت نشده است."
					emptyHint="بیماری، تشخیص، درمان و داروهای تجویزشده را از فرم پایین ثبت کنید."
				/>
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
							placeholder="طبق نظر پزشک"
						/>
					</Field>
					<Field label="تاریخ شروع (شمسی)">
						<JalaliDateInput
							value={form.startDate}
							onChange={(value) => setForm({ ...form, startDate: value })}
							yearsBack={10}
							yearsAhead={0}
						/>
					</Field>
					<Field label="تاریخ پایان (اختیاری)">
						<JalaliDateInput
							value={form.endDate}
							onChange={(value) => setForm({ ...form, endDate: value })}
							yearsBack={10}
							yearsAhead={0}
						/>
					</Field>
					<div className="care-form__wide">
						<Field label="درمان انجام‌شده">
							<TextArea
								value={form.treatment}
								onChange={(value) => setForm({ ...form, treatment: value })}
								placeholder="مانند استراحت و مایعات کافی"
							/>
						</Field>
					</div>
					<div className="care-form__wide">
						<Field
							label="داروهای تجویزشده"
							hint="نام داروها را با کاما جدا کنید. فقط ثبت تجویز پزشک است."
						>
							<TextArea
								value={form.medications}
								onChange={(value) => setForm({ ...form, medications: value })}
								placeholder="مانند قطره سالین بینی"
							/>
						</Field>
					</div>
					<div className="care-form__wide">
						<Field label="یادداشت پزشک">
							<TextArea
								value={form.doctorNotes}
								onChange={(value) => setForm({ ...form, doctorNotes: value })}
								placeholder="توضیح یا هشدار پزشک"
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
		</div>
	)
}
