import { useMemo, useState } from "react"
import { useData } from "../../app/providers/DataProvider"
import {
	Badge,
	Button,
	Card,
	EmptyState,
	Field,
	FormRow,
	Grid,
	PageHeader,
	Select,
	Stat,
	TextInput,
} from "../../shared/components/ui"
import { JalaliDateInput } from "../../shared/components/DateInput"
import { GrowthChart } from "../../shared/components/GrowthChart"
import type { ChartPoint } from "../../shared/components/GrowthChart"
import { useMotherContext } from "./useMotherContext"
import { useSelectedChild } from "../../shared/hooks/useSelectedChild"
import {
	getChildren,
	getGrowth,
	getHealthRecords,
	getMilestones,
	getVaccinations,
} from "../../services/selectors"
import { addGrowthMeasurement, setMilestoneAchieved, setVaccinationDone } from "../../services/mutations"
import { HEALTH_RECORD_KIND_LABELS, NOT_RECORDED, SEX_LABELS } from "../../shared/constants/labels"
import { ageInMonths, formatAge, formatDate, todayIso, toFa } from "../../shared/utils/date"

type Metric = "weight" | "height" | "head"

const METRICS: Array<{ value: Metric; label: string; unit: string }> = [
	{ value: "weight", label: "وزن", unit: "کیلوگرم" },
	{ value: "height", label: "قد", unit: "سانتی‌متر" },
	{ value: "head", label: "دور سر", unit: "سانتی‌متر" },
]

export function ChildrenPage() {
	const { db, motherId } = useMotherContext()
	const { mutate } = useData()
	const children = getChildren(db, motherId)
	const { child, selectChild, options } = useSelectedChild(children)
	const [metric, setMetric] = useState<Metric>("weight")
	const [growthForm, setGrowthForm] = useState({ date: todayIso(), weight: "", height: "", head: "" })
	const [growthError, setGrowthError] = useState<string | null>(null)

	const growth = useMemo(() => (child ? getGrowth(db, child.id) : []), [db, child])

	const chartPoints = useMemo<ChartPoint[]>(() => {
		const ordered = [...growth].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
		return ordered
			.map((item) => {
				const raw =
					metric === "weight" ? item.weightKg : metric === "height" ? item.heightCm : item.headCm
				return typeof raw === "number" && Number.isFinite(raw) ? { date: item.date, value: raw } : null
			})
			.filter((point): point is ChartPoint => point !== null)
	}, [growth, metric])

	if (children.length === 0 || !child) {
		return (
			<>
				<PageHeader title="کودکان" />
				<Card>
					<EmptyState
						title="پرونده کودکی ثبت نشده است."
						hint="پس از ثبت زایمان در بخش بارداری‌ها، پرونده کودک ساخته می‌شود."
					/>
				</Card>
			</>
		)
	}

	const vaccinations = getVaccinations(db, child.id)
	const milestones = getMilestones(db, child.id)
	const records = getHealthRecords(db, child.id)
	const months = ageInMonths(child.birthDate)
	const activeMetric = METRICS.find((item) => item.value === metric) ?? METRICS[0]

	const submitGrowth = () => {
		if (!growthForm.date) return setGrowthError("تاریخ اندازه‌گیری الزامی است.")
		const numbers = [growthForm.weight, growthForm.height, growthForm.head]
		if (numbers.every((value) => value.trim() === ""))
			return setGrowthError("دست‌کم یکی از مقادیر وزن، قد یا دور سر را وارد کنید.")
		if (numbers.some((value) => value.trim() !== "" && !Number.isFinite(Number(value))))
			return setGrowthError("مقادیر اندازه‌گیری باید عدد باشند.")
		if (numbers.some((value) => value.trim() !== "" && Number(value) < 0))
			return setGrowthError("مقادیر اندازه‌گیری نمی‌توانند منفی باشند.")
		setGrowthError(null)
		void mutate((current) =>
			addGrowthMeasurement(current, {
				childId: child.id,
				date: growthForm.date,
				weightKg: growthForm.weight.trim() ? Number(growthForm.weight) : null,
				heightCm: growthForm.height.trim() ? Number(growthForm.height) : null,
				headCm: growthForm.head.trim() ? Number(growthForm.head) : null,
			}),
		).then(() => setGrowthForm({ date: todayIso(), weight: "", height: "", head: "" }))
		return undefined
	}

	return (
		<>
			<PageHeader
				title="پرونده کودکان"
				subtitle="واکسیناسیون، رشد، مراحل تحول و سابقه سلامت"
				actions={<Select inline value={child.id} onChange={selectChild} options={options} />}
			/>

			<Grid cols={4}>
				<Stat label="کودک" value={child.name} hint={SEX_LABELS[child.sex]} />
				<Stat label="سن" value={formatAge(child.birthDate)} />
				<Stat label="تاریخ تولد" value={formatDate(child.birthDate)} />
				<Stat
					label="واکسن انجام‌نشده"
					value={toFa(vaccinations.filter((item) => !item.doneDate).length)}
					hint={
						vaccinations.some((item) => !item.doneDate && item.dueDate < todayIso())
							? `${toFa(vaccinations.filter((item) => !item.doneDate && item.dueDate < todayIso()).length)} مورد عقب‌افتاده`
							: undefined
					}
					tone={vaccinations.some((item) => !item.doneDate) ? "warn" : "success"}
				/>
			</Grid>

			<Grid cols={2}>
				<Card title="واکسیناسیون">
					{vaccinations.length === 0 ? (
						<EmptyState title="نوبت واکسیناسیونی ثبت نشده است." />
					) : (
						<ul className="list">
							{vaccinations.map((item) => (
								<li key={item.id} className="list__item">
									<div>
										<strong>{item.name}</strong>
										<p className="muted">موعد: {formatDate(item.dueDate)}</p>
									</div>
									<div className="row-actions">
										<Badge
											tone={
												item.doneDate ? "success" : item.dueDate < todayIso() ? "danger" : "warn"
											}
										>
											{item.doneDate
												? `انجام شد: ${formatDate(item.doneDate)}`
												: item.dueDate < todayIso()
													? "عقب‌افتاده"
													: "انجام نشده"}
										</Badge>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												void mutate((current) =>
													setVaccinationDone(current, item.id, item.doneDate ? null : todayIso()),
												)
											}}
										>
											{item.doneDate ? "لغو ثبت" : "ثبت انجام"}
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</Card>

				<Card title="مراحل تحول">
					{milestones.length === 0 ? (
						<EmptyState title="مرحله رشدی ثبت نشده است." />
					) : (
						<ul className="list">
							{milestones.map((item) => {
								const overdue = !item.achievedDate && months !== null && months > item.expectedAgeMonths
								return (
									<li key={item.id} className="list__item">
										<div>
											<strong>{item.title}</strong>
											<p className="muted">مورد انتظار تا {toFa(item.expectedAgeMonths)} ماهگی</p>
											{item.note && <p>{item.note}</p>}
										</div>
										<div className="row-actions">
											<Badge tone={item.achievedDate ? "success" : overdue ? "warn" : "neutral"}>
												{item.achievedDate
													? formatDate(item.achievedDate)
													: overdue
														? "نیازمند پیگیری"
														: NOT_RECORDED}
											</Badge>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													void mutate((current) =>
														setMilestoneAchieved(current, item.id, item.achievedDate ? null : todayIso()),
													)
												}}
											>
												{item.achievedDate ? "لغو ثبت" : "ثبت دستیابی"}
											</Button>
										</div>
									</li>
								)
							})}
						</ul>
					)}
				</Card>
			</Grid>

			<Card
				title="نمودار رشد"
				subtitle="روند اندازه‌گیری‌های ثبت‌شده؛ محور زمان از راست (قدیمی‌تر) به چپ (تازه‌تر)"
				actions={
					<Select
						inline
						value={metric}
						onChange={(value) => setMetric(value as Metric)}
						options={METRICS.map((item) => ({ value: item.value, label: item.label }))}
					/>
				}
			>
				<GrowthChart
					points={chartPoints}
					unit={activeMetric.unit}
					empty={`برای «${activeMetric.label}» هنوز اندازه‌گیری ثبت نشده است.`}
				/>
			</Card>

			<Card title="اندازه‌گیری رشد">
				<FormRow>
					<Field label="تاریخ (شمسی)">
						<JalaliDateInput
							value={growthForm.date}
							onChange={(value) => setGrowthForm({ ...growthForm, date: value })}
						/>
					</Field>
					<Field label="وزن (کیلوگرم)">
						<TextInput
							type="number"
							inputMode="numeric"
							value={growthForm.weight}
							onChange={(value) => setGrowthForm({ ...growthForm, weight: value })}
						/>
					</Field>
					<Field label="قد (سانتی‌متر)">
						<TextInput
							type="number"
							inputMode="numeric"
							value={growthForm.height}
							onChange={(value) => setGrowthForm({ ...growthForm, height: value })}
						/>
					</Field>
					<Field label="دور سر (سانتی‌متر)">
						<TextInput
							type="number"
							inputMode="numeric"
							value={growthForm.head}
							onChange={(value) => setGrowthForm({ ...growthForm, head: value })}
						/>
					</Field>
				</FormRow>
				{growthError && <p className="muted">{growthError}</p>}
				<Button variant="primary" icon="plus" onClick={submitGrowth}>
					ثبت اندازه‌گیری
				</Button>

				{growth.length === 0 ? (
					<EmptyState title="اندازه‌گیری ثبت نشده است." />
				) : (
					<div className="table-wrap">
						<table className="table">
							<thead>
								<tr>
									<th>تاریخ</th>
									<th>وزن</th>
									<th>قد</th>
									<th>دور سر</th>
								</tr>
							</thead>
							<tbody>
								{growth.map((item) => (
									<tr key={item.id}>
										<td>{formatDate(item.date)}</td>
										<td>{typeof item.weightKg === "number" ? toFa(item.weightKg) : NOT_RECORDED}</td>
										<td>{typeof item.heightCm === "number" ? toFa(item.heightCm) : NOT_RECORDED}</td>
										<td>{typeof item.headCm === "number" ? toFa(item.headCm) : NOT_RECORDED}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			<Card title="سابقه سلامت">
				{records.length === 0 ? (
					<EmptyState title="رویداد سلامتی ثبت نشده است." />
				) : (
					<ul className="list">
						{records.map((item) => (
							<li key={item.id} className="list__item">
								<div>
									<strong>{item.title}</strong>
									<p className="muted">
										{formatDate(item.date)} · {HEALTH_RECORD_KIND_LABELS[item.kind]}
									</p>
									{item.description && <p>{item.description}</p>}
								</div>
							</li>
						))}
					</ul>
				)}
			</Card>
		</>
	)
}
