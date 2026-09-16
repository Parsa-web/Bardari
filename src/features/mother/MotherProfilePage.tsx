import { Alert, Card, EmptyState, Grid, PageHeader, Stat } from "../../shared/components/ui"
import { useMotherContext } from "./useMotherContext"
import { getChildren, getPregnancies, getProviderName, motherFullName } from "../../services/selectors"
import { NOT_RECORDED, PREGNANCY_STATUS_LABELS } from "../../shared/constants/labels"
import { formatAge, formatDate, toFa } from "../../shared/utils/date"

export function MotherProfilePage() {
	const { db, mother, motherId } = useMotherContext()
	if (!mother) return <Alert tone="warn">پرونده مادر پیدا نشد.</Alert>

	const pregnancies = getPregnancies(db, motherId)
	const children = getChildren(db, motherId)

	return (
		<>
			<PageHeader title="پروفایل من" subtitle="اطلاعات پایه و تیم مراقبت" />

			<Grid cols={4}>
				<Stat label="نام و نام خانوادگی" value={motherFullName(mother)} />
				<Stat label="سن" value={mother.birthDate ? formatAge(mother.birthDate) : NOT_RECORDED} />
				<Stat label="تعداد بارداری‌ها" value={toFa(pregnancies.length)} />
				<Stat label="تعداد کودکان" value={toFa(children.length)} />
			</Grid>

			<Grid cols={2}>
				<Card title="اطلاعات تماس و پایه">
					<dl className="pairs">
						<div>
							<dt>شماره تماس</dt>
							<dd>{mother.phone ? toFa(mother.phone) : NOT_RECORDED}</dd>
						</div>
						<div>
							<dt>تاریخ تولد</dt>
							<dd>{mother.birthDate ? formatDate(mother.birthDate) : NOT_RECORDED}</dd>
						</div>
						<div>
							<dt>گروه خونی</dt>
							<dd>{mother.bloodType ?? NOT_RECORDED}</dd>
						</div>
						<div>
							<dt>شهر</dt>
							<dd>{mother.city ?? NOT_RECORDED}</dd>
						</div>
					</dl>
					{mother.note && <p className="muted">{mother.note}</p>}
				</Card>

				<Card title="تیم مراقبت">
					<dl className="pairs">
						<div>
							<dt>مامای مسئول</dt>
							<dd>{getProviderName(db, mother.careTeam.midwifeId)}</dd>
						</div>
						<div>
							<dt>متخصصان</dt>
							<dd>
								{mother.careTeam.specialistIds.length === 0
									? NOT_RECORDED
									: mother.careTeam.specialistIds
											.map((id) => getProviderName(db, id))
											.join("، ")}
							</dd>
						</div>
					</dl>
				</Card>
			</Grid>

			<Card title="خلاصه بارداری‌ها">
				{pregnancies.length === 0 ? (
					<EmptyState title="بارداری‌ای ثبت نشده است." />
				) : (
					<ul className="list">
						{pregnancies.map((pregnancy) => (
							<li key={pregnancy.id} className="list__item">
								<div>
									<strong>{pregnancy.label}</strong>
									<p className="muted">{PREGNANCY_STATUS_LABELS[pregnancy.status]}</p>
								</div>
								<span className="muted">
									{pregnancy.birth ? `تولد: ${formatDate(pregnancy.birth.date)}` : ""}
								</span>
							</li>
						))}
					</ul>
				)}
			</Card>
		</>
	)
}
