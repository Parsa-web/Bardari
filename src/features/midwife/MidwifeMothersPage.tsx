import { useState } from "react"
import { Badge, Card, EmptyState, Grid, PageHeader, Stat } from "../../shared/components/ui"
import { useProviderSession } from "./useProviderSession"
import {
	checkupViewStatus,
	getActivePregnancy,
	getActivities,
	getChildren,
	getCheckups,
	getMothersOfMidwife,
	getQuestions,
	isOpenQuestion,
	motherFullName,
	subjectLabel,
} from "../../services/selectors"
import {
	ACTIVITY_CATEGORY_LABELS,
	CHECKUP_STATUS_LABELS,
	CHECKUP_STATUS_TONES,
	NOT_RECORDED,
} from "../../shared/constants/labels"
import { formatAge, formatDateTime, formatGestation, gestation, toFa } from "../../shared/utils/date"

/** پرونده مادران تحت مراقبت: فهرست + جزئیات کنار هم. */
export function MidwifeMothersPage() {
	const { db, providerId } = useProviderSession()
	const mothers = getMothersOfMidwife(db, providerId)
	const [selectedId, setSelectedId] = useState(mothers[0]?.id ?? "")

	if (mothers.length === 0) {
		return (
			<>
				<PageHeader title="مادران تحت مراقبت" />
				<Card>
					<EmptyState title="مادری به شما تخصیص داده نشده است." />
				</Card>
			</>
		)
	}

	const mother = mothers.find((item) => item.id === selectedId) ?? mothers[0]
	const pregnancy = getActivePregnancy(db, mother.id)
	const children = getChildren(db, mother.id)
	const checkups = getCheckups(db, mother.id)
	const activities = getActivities(db, mother.id).slice(0, 8)
	const openQuestions = getQuestions(db, { motherId: mother.id }).filter(isOpenQuestion)

	return (
		<>
			<PageHeader title="مادران تحت مراقبت" subtitle="برای مشاهده پرونده، مادر را انتخاب کنید" />

			<div className="split">
				<Card title="فهرست مادران">
					<ul className="list list--selectable">
						{mothers.map((item) => {
							const itemPregnancy = getActivePregnancy(db, item.id)
							return (
								<li key={item.id}>
									<button
										type="button"
										className={`list__button${item.id === mother.id ? " is-active" : ""}`}
										onClick={() => setSelectedId(item.id)}
									>
										<strong>{motherFullName(item)}</strong>
										<span className="muted">
											{itemPregnancy
												? formatGestation(
														gestation({ lmpDate: itemPregnancy.lmpDate, eddDate: itemPregnancy.eddDate }),
													)
												: "بارداری فعال ندارد"}
										</span>
									</button>
								</li>
							)
						})}
					</ul>
				</Card>

				<div className="split__main">
					<Grid cols={4}>
						<Stat label="مادر" value={motherFullName(mother)} hint={mother.city ?? ""} />
						<Stat
							label="بارداری فعال"
							value={
								pregnancy
									? formatGestation(gestation({ lmpDate: pregnancy.lmpDate, eddDate: pregnancy.eddDate }))
									: NOT_RECORDED
							}
						/>
						<Stat label="کودکان" value={toFa(children.length)} />
						<Stat label="سؤال باز" value={toFa(openQuestions.length)} tone={openQuestions.length ? "warn" : "neutral"} />
					</Grid>

					<Grid cols={2}>
						<Card title="فعالیت‌های اخیر مادر">
							{activities.length === 0 ? (
								<EmptyState title="فعالیتی ثبت نشده است." />
							) : (
								<ul className="list">
									{activities.map((activity) => (
										<li key={activity.id} className="list__item">
											<div>
												<strong>{activity.title}</strong>
												<p className="muted">
													{formatDateTime(activity.date, activity.time)} ·{" "}
													{ACTIVITY_CATEGORY_LABELS[activity.category]} · {subjectLabel(db, activity.subject)}
												</p>
											</div>
											{activity.severity ? <Badge tone="warn">شدت {toFa(activity.severity)}</Badge> : null}
										</li>
									))}
								</ul>
							)}
						</Card>

						<Card title="چکاپ‌های مادر">
							{checkups.length === 0 ? (
								<EmptyState title="چکاپی ثبت نشده است." />
							) : (
								<ul className="list">
									{checkups.map((checkup) => {
										const view = checkupViewStatus(checkup)
										return (
											<li key={checkup.id} className="list__item">
												<div>
													<strong>{checkup.title}</strong>
													<p className="muted">{formatDateTime(checkup.date, checkup.time)}</p>
												</div>
												<Badge tone={CHECKUP_STATUS_TONES[view]}>{CHECKUP_STATUS_LABELS[view]}</Badge>
											</li>
										)
									})}
								</ul>
							)}
						</Card>
					</Grid>

					<Card title="کودکان مادر">
						{children.length === 0 ? (
							<EmptyState title="پرونده کودکی ثبت نشده است." />
						) : (
							<ul className="list">
								{children.map((child) => (
									<li key={child.id} className="list__item">
										<div>
											<strong>کودک: {child.name}</strong>
											<p className="muted">سن: {formatAge(child.birthDate)}</p>
										</div>
									</li>
								))}
							</ul>
						)}
					</Card>
				</div>
			</div>
		</>
	)
}
