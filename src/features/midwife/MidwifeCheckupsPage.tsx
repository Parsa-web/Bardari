import { useMemo, useState } from "react"
import { useData } from "../../app/providers/DataProvider"
import {
	Badge,
	Button,
	Card,
	EmptyState,
	Field,
	PageHeader,
	Select,
	TextInput,
} from "../../shared/components/ui"
import { useProviderSession } from "./useProviderSession"
import {
	checkupViewStatus,
	getCheckups,
	getMother,
	getMothersOfMidwife,
	motherFullName,
	subjectLabel,
} from "../../services/selectors"
import { setCheckupStatus } from "../../services/mutations"
import {
	CHECKUP_STATUS_LABELS,
	CHECKUP_STATUS_TONES,
	CHECKUP_TYPE_LABELS,
} from "../../shared/constants/labels"
import { formatDateTime, toFa } from "../../shared/utils/date"

const UPCOMING_RANK: Record<string, number> = { overdue: 0, due_soon: 1, pending: 2 }

export function MidwifeCheckupsPage() {
	const { db, providerId, displayName } = useProviderSession()
	const { mutate } = useData()
	const [filter, setFilter] = useState<string>("all")
	const [search, setSearch] = useState("")

	const allRows = useMemo(() => {
		const mothers = getMothersOfMidwife(db, providerId)
		return mothers.flatMap((mother) => getCheckups(db, mother.id))
	}, [db, providerId])

	type CheckupItem = (typeof allRows)[number]

	const filtered = useMemo(() => {
		const term = search.trim().toLowerCase()
		return allRows.filter((checkup) => {
			if (filter !== "all" && checkupViewStatus(checkup) !== filter) return false
			if (!term) return true
			const haystack = [
				checkup.title,
				motherFullName(getMother(db, checkup.motherId)),
				CHECKUP_TYPE_LABELS[checkup.type],
				checkup.providerName ?? "",
			]
				.join(" ")
				.toLowerCase()
			return haystack.includes(term)
		})
	}, [allRows, db, filter, search])

	const upcoming = useMemo(
		() =>
			filtered
				.filter((checkup) => checkupViewStatus(checkup) in UPCOMING_RANK)
				.sort((a, b) => {
					const rankA = UPCOMING_RANK[checkupViewStatus(a)] ?? 9
					const rankB = UPCOMING_RANK[checkupViewStatus(b)] ?? 9
					if (rankA !== rankB) return rankA - rankB
					if (a.date !== b.date) return a.date < b.date ? -1 : 1
					return (a.time ?? "") < (b.time ?? "") ? -1 : 1
				}),
		[filtered],
	)

	const archive = useMemo(
		() =>
			filtered
				.filter((checkup) => !(checkupViewStatus(checkup) in UPCOMING_RANK))
				.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
		[filtered],
	)

	const renderItem = (checkup: CheckupItem) => {
		const view = checkupViewStatus(checkup)
		return (
			<li key={checkup.id} className={`list__item list__item--${view}`}>
				<div>
					<strong>{checkup.title}</strong>
					<p className="muted">
						{motherFullName(getMother(db, checkup.motherId))} ·{" "}
						{formatDateTime(checkup.date, checkup.time)} · {CHECKUP_TYPE_LABELS[checkup.type]} ·{" "}
						{subjectLabel(db, checkup.subject)}
					</p>
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
									void mutate((current) => setCheckupStatus(current, checkup.id, "missed"))
								}}
							>
								انجام نشد
							</Button>
						</>
					)}
				</div>
			</li>
		)
	}

	return (
		<>
			<PageHeader title="چکاپ‌های مادران" subtitle={`مراقب مسئول: ${displayName}`} />

			<Card title="فهرست چکاپ‌ها">
				<div className="filterbar">
					<Field label="جستجو">
						<TextInput
							value={search}
							placeholder="نام مادر یا عنوان چکاپ"
							onChange={(value) => setSearch(value)}
						/>
					</Field>
					<Field label="وضعیت">
						<Select
							value={filter}
							onChange={setFilter}
							options={[
								{ value: "all", label: "همه وضعیت‌ها" },
								...Object.entries(CHECKUP_STATUS_LABELS).map(([value, label]) => ({
									value,
									label: String(label),
								})),
							]}
						/>
					</Field>
					<Field label="تعداد">
						<p className="result-count">
							{toFa(filtered.length)} از {toFa(allRows.length)} چکاپ
						</p>
					</Field>
				</div>

				{filtered.length === 0 ? (
					<EmptyState title="چکاپی با این فیلتر یافت نشد." />
				) : (
					<>
						{upcoming.length > 0 && (
							<div className="group">
								<div className="group__head">
									<h3 className="group__title">نیازمند پیگیری</h3>
									<span className="group__count">{toFa(upcoming.length)} مورد</span>
								</div>
								<ul className="list">{upcoming.map(renderItem)}</ul>
							</div>
						)}
						{archive.length > 0 && (
							<div className="group">
								<div className="group__head">
									<h3 className="group__title">بایگانی</h3>
									<span className="group__count">{toFa(archive.length)} مورد</span>
								</div>
								<ul className="list">{archive.map(renderItem)}</ul>
							</div>
						)}
					</>
				)}
			</Card>
		</>
	)
}
