import { useState } from "react"
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
	Stat,
} from "../../shared/components/ui"
import { useMotherContext } from "./useMotherContext"
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

export function ChildrenPage() {
	const { db, motherId } = useMotherContext()
	const { mutate } = useData()
	const children = getChildren(db, motherId)
	const [selectedId, setSelectedId] = useState<string>(children[0]?.id ?? "")
	const [growthForm, setGrowthForm] = useState({ date: todayIso(), weight: "", height: "", head: "" })

	if (children.length === 0) {
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

	const child = children.find((item) => item.id === selectedId) ?? children[0]
	const vaccinations = getVaccinations(db, child.id)
	const growth = getGrowth(db, child.id)
	const milestones = getMilestones(db, child.id)
	const records = getHealthRecords(db, child.id)
	const months = ageInMonths(child.birthDate)

	const submitGrowth = () => {
		if (!growthForm.date) return
		void mutate((current) =>
			addGrowthMeasurement(current, {
				childId: child.id,
				date: growthForm.date,
				weightKg: growthForm.weight ? Number(growthForm.weight) : null,
				heightCm: growthForm.height ? Number(growthForm.height) : null,
				headCm: growthForm.head ? Number(growthForm.head) : null,
			}),
		).then(() => setGrowthForm({ date: todayIso(), weight: "", height: "", head: "" }))
	}

	return (
		<>
			<PageHeader
				title="پرونده کودکان"
				subtitle="واکسیناسیون، رشد، مراحل تحول و سابقه سلامت"
				actions={
					<select className="input input--inline" value={child.id} onChange={(event) => setSelectedId(event.target.value)}>
						{children.map((item) => (
							<option key={item.id} value={item.id}>
								{item.name}
							</option>
						))}
					</select>
				}
			/>

			<Grid cols={4}>
				<Stat label="کودک" value={child.name} hint={SEX_LABELS[child.sex]} />
				<Stat label="سن" value={formatAge(child.birthDate)} />
				<Stat label="تاریخ تولد" value={formatDate(child.birthDate)} />
				<Stat
					label="واکسن انجام‌نشده"
					value={toFa(vaccinations.filter((item) => !item.doneDate).length)}
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
										<Badge tone={item.doneDate ? "success" : "warn"}>
											{item.doneDate ? `انجام شد: ${formatDate(item.doneDate)}` : "انجام نشده"}
										</Badge>
										<Button
											variant="ghost"
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

			<Card title="اندازه‌گیری رشد">
				<FormRow>
					<Field label="تاریخ">
						<input
							className="input"
							type="date"
							value={growthForm.date}
							onChange={(event) => setGrowthForm({ ...growthForm, date: event.target.value })}
						/>
					</Field>
					<Field label="وزن (کیلوگرم)">
						<input
							className="input"
							type="number"
							step="0.1"
							value={growthForm.weight}
							onChange={(event) => setGrowthForm({ ...growthForm, weight: event.target.value })}
						/>
					</Field>
					<Field label="قد (سانتی‌متر)">
						<input
							className="input"
							type="number"
							step="0.5"
							value={growthForm.height}
							onChange={(event) => setGrowthForm({ ...growthForm, height: event.target.value })}
						/>
					</Field>
					<Field label="دور سر (سانتی‌متر)">
						<input
							className="input"
							type="number"
							step="0.5"
							value={growthForm.head}
							onChange={(event) => setGrowthForm({ ...growthForm, head: event.target.value })}
						/>
					</Field>
				</FormRow>
				<Button variant="primary" onClick={submitGrowth}>
					ثبت اندازه‌گیری
				</Button>

				{growth.length === 0 ? (
					<EmptyState title="اندازه‌گیری ثبت نشده است." />
				) : (
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
									<td>{item.weightKg ? toFa(item.weightKg) : "—"}</td>
									<td>{item.heightCm ? toFa(item.heightCm) : "—"}</td>
									<td>{item.headCm ? toFa(item.headCm) : "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
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
