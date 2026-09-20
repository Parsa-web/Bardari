import { useMemo, useState } from "react"
import { useData } from "../../app/providers/DataProvider"
import {
	Alert,
	Badge,
	Button,
	Card,
	EmptyState,
	Field,
	FormRow,
	PageHeader,
	Select,
	TextArea,
	TextInput,
} from "../../shared/components/ui"
import { JalaliDateInput } from "../../shared/components/DateInput"
import { decodeSubject, useMotherContext } from "./useMotherContext"
import { checkupViewStatus, getCheckups, subjectLabel } from "../../services/selectors"
import { addCheckup, setCheckupStatus } from "../../services/mutations"
import {
	CHECKUP_STATUS_LABELS,
	CHECKUP_STATUS_TONES,
	CHECKUP_TYPE_LABELS,
} from "../../shared/constants/labels"
import type { CheckupType } from "../../shared/types/domain"
import { formatDateTime, todayIso, toFa } from "../../shared/utils/date"

const TYPES = Object.keys(CHECKUP_TYPE_LABELS) as CheckupType[]

const UPCOMING_RANK: Record<string, number> = { overdue: 0, due_soon: 1, pending: 2 }

export function MotherCheckupsPage() {
	const { db, motherId, subjectOptions } = useMotherContext()
	const { mutate } = useData()
	const [error, setError] = useState<string | null>(null)
	const [search, setSearch] = useState("")
	const [statusFilter, setStatusFilter] = useState<string>("all")
	const [typeFilter, setTypeFilter] = useState<string>("all")
	const [form, setForm] = useState({
		subjectValue: subjectOptions[1]?.value ?? subjectOptions[0]?.value ?? "",
		title: "",
		type: "prenatal" as CheckupType,
		date: todayIso(),
		time: "",
		providerName: "",
		description: "",
	})

	const checkups = useMemo(() => getCheckups(db, motherId), [db, motherId])

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase()
		return checkups.filter((checkup) => {
			const view = checkupViewStatus(checkup)
			if (statusFilter !== "all" && view !== statusFilter) return false
			if (typeFilter !== "all" && checkup.type !== typeFilter) return false
			if (!term) return true
			const haystack = [
				checkup.title,
				checkup.providerName ?? "",
				checkup.description ?? "",
				CHECKUP_TYPE_LABELS[checkup.type],
				subjectLabel(db, checkup.subject),
			]
				.join(" ")
				.toLowerCase()
			return haystack.includes(term)
		})
	}, [checkups, db, search, statusFilter, typeFilter])

	const upcoming = useMemo(() => {
		return filtered
			.filter((checkup) => checkupViewStatus(checkup) in UPCOMING_RANK)
			.sort((a, b) => {
				const rankA = UPCOMING_RANK[checkupViewStatus(a)] ?? 9
				const rankB = UPCOMING_RANK[checkupViewStatus(b)] ?? 9
				if (rankA !== rankB) return rankA - rankB
				if (a.date !== b.date) return a.date < b.date ? -1 : 1
				return (a.time ?? "") < (b.time ?? "") ? -1 : 1
			})
	}, [filtered])

	const archive = useMemo(() => {
		return filtered
			.filter((checkup) => !(checkupViewStatus(checkup) in UPCOMING_RANK))
			.sort((a, b) => {
				if (a.date !== b.date) return a.date < b.date ? 1 : -1
				return (a.time ?? "") < (b.time ?? "") ? 1 : -1
			})
	}, [filtered])

	const submit = () => {
		const subject = decodeSubject(form.subjectValue)
		if (!subject) {
			setError("موضوع چکاپ را انتخاب کنید.")
			return
		}
		if (!form.title.trim() || !form.date) {
			setError("عنوان و تاریخ چکاپ الزامی است.")
			return
		}
		setError(null)
		void mutate((current) =>
			addCheckup(current, {
				motherId,
				subject,
				title: form.title.trim(),
				type: form.type,
				date: form.date,
				time: form.time || undefined,
				providerName: form.providerName.trim() || undefined,
				description: form.description.trim() || undefined,
			}),
		).then(() => setForm({ ...form, title: "", time: "", providerName: "", description: "" }))
	}

	type CheckupItem = (typeof checkups)[number]

	const renderItem = (checkup: CheckupItem) => {
		const view = checkupViewStatus(checkup)
		return (
			<li key={checkup.id} className={`list__item list__item--${view}`}>
				<div>
					<strong>{checkup.title}</strong>
					<p className="muted">
						{formatDateTime(checkup.date, checkup.time)} · {CHECKUP_TYPE_LABELS[checkup.type]} ·{" "}
						{subjectLabel(db, checkup.subject)}
					</p>
					{checkup.providerName && <p className="muted">مراقب: {checkup.providerName}</p>}
					{checkup.description && <p>{checkup.description}</p>}
				</div>
				<div className="row-actions">
					<Badge tone={CHECKUP_STATUS_TONES[view]}>{CHECKUP_STATUS_LABELS[view]}</Badge>
					{checkup.status === "pending" && (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									void mutate((current) => setCheckupStatus(current, checkup.id, "done"))
								}}
							>
								انجام شد
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									void mutate((current) => setCheckupStatus(current, checkup.id, "canceled"))
								}}
							>
								لغو
							</Button>
						</>
					)}
				</div>
			</li>
		)
	}

	const statusOptions = [
		{ value: "all", label: "همه وضعیت‌ها" },
		...Object.entries(CHECKUP_STATUS_LABELS).map(([value, label]) => ({
			value,
			label: String(label),
		})),
	]

	return (
		<>
			<PageHeader title="چکاپ‌ها" subtitle="مراقبت‌ها، آزمایش‌ها و نوبت‌های ثبت‌شده" />

			{error && <Alert tone="danger">{error}</Alert>}

			<Card title="فهرست چکاپ‌ها">
				<div className="filterbar">
					<Field label="جستجو">
						<TextInput
							value={search}
							placeholder="عنوان، مراقب یا توضیحات"
							onChange={(value) => setSearch(value)}
						/>
					</Field>
					<Field label="وضعیت">
						<Select value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
					</Field>
					<Field label="نوع">
						<Select
							value={typeFilter}
							onChange={setTypeFilter}
							options={[
								{ value: "all", label: "همه نوع‌ها" },
								...TYPES.map((type) => ({ value: type, label: CHECKUP_TYPE_LABELS[type] })),
							]}
						/>
					</Field>
				</div>

				<p className="result-count">
					{toFa(filtered.length)} چکاپ از مجموع {toFa(checkups.length)} مورد
				</p>

				{filtered.length === 0 ? (
					<EmptyState title="چکاپی با این فیلتر یافت نشد." />
				) : (
					<>
						{upcoming.length > 0 && (
							<div className="group">
								<div className="group__head">
									<h3 className="group__title">در پیش و نیازمند پیگیری</h3>
									<span className="group__count">{toFa(upcoming.length)} مورد</span>
								</div>
								<ul className="list">{upcoming.map(renderItem)}</ul>
							</div>
						)}
						{archive.length > 0 && (
							<div className="group">
								<div className="group__head">
									<h3 className="group__title">بایگانی (انجام‌شده یا بسته)</h3>
									<span className="group__count">{toFa(archive.length)} مورد</span>
								</div>
								<ul className="list">{archive.map(renderItem)}</ul>
							</div>
						)}
					</>
				)}
			</Card>

			<Card title="ثبت چکاپ جدید">
				<FormRow>
					<Field label="موضوع">
						<Select
							value={form.subjectValue}
							onChange={(value) => setForm({ ...form, subjectValue: value })}
							options={subjectOptions.map((option) => ({ value: option.value, label: option.label }))}
						/>
					</Field>
					<Field label="نوع">
						<Select
							value={form.type}
							onChange={(value) => setForm({ ...form, type: value as CheckupType })}
							options={TYPES.map((type) => ({ value: type, label: CHECKUP_TYPE_LABELS[type] }))}
						/>
					</Field>
				</FormRow>
				<FormRow>
					<Field label="تاریخ (شمسی)">
						<JalaliDateInput
							value={form.date}
							yearsAhead={3}
							onChange={(value) => setForm({ ...form, date: value })}
						/>
					</Field>
					<Field label="ساعت" hint="اختیاری">
						<TextInput
							type="time"
							value={form.time}
							onChange={(value) => setForm({ ...form, time: value })}
						/>
					</Field>
				</FormRow>
				<Field label="عنوان">
					<TextInput value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
				</Field>
				<Field label="مراقب سلامت" hint="اختیاری">
					<TextInput
						value={form.providerName}
						onChange={(value) => setForm({ ...form, providerName: value })}
					/>
				</Field>
				<Field label="توضیحات" hint="اختیاری">
					<TextArea
						value={form.description}
						onChange={(value) => setForm({ ...form, description: value })}
					/>
				</Field>
				<Button variant="primary" icon="plus" onClick={submit}>
					ثبت چکاپ
				</Button>
			</Card>
		</>
	)
}
