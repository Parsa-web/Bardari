import { useMemo } from "react"
import { useData } from "../../app/providers/DataProvider"
import { useSession } from "../../app/providers/SessionProvider"
import type { AppDatabase, Mother, SubjectRef } from "../../shared/types/domain"
import { getActivePregnancy, getChildren, getMother, getPregnancies } from "../../services/selectors"

export type MotherContext = {
	db: AppDatabase
	mother: Mother | null
	motherId: string
	displayName: string
	subjectOptions: Array<{ value: string; label: string; subject: SubjectRef }>
}

function encode(subject: SubjectRef): string {
	return `${subject.kind}:${subject.id}`
}

export function decodeSubject(value: string): SubjectRef | null {
	const [kind, id] = value.split(":")
	if (!kind || !id) return null
	if (kind !== "mother" && kind !== "pregnancy" && kind !== "child") return null
	return { kind, id }
}

export function encodeSubject(subject: SubjectRef): string {
	return encode(subject)
}

/** داده مشترک صفحات نقش مادر. */
export function useMotherContext(): MotherContext {
	const { db } = useData()
	const { session } = useSession()
	const motherId = session?.motherId ?? ""

	return useMemo(() => {
		if (!db) throw new Error("داده بارگذاری نشده است.")
		const mother = getMother(db, motherId)
		const options: MotherContext["subjectOptions"] = []
		if (motherId) {
			options.push({
				value: encode({ kind: "mother", id: motherId }),
				label: "خودم (مادر)",
				subject: { kind: "mother", id: motherId },
			})
			for (const pregnancy of getPregnancies(db, motherId)) {
				options.push({
					value: encode({ kind: "pregnancy", id: pregnancy.id }),
					label: `بارداری: ${pregnancy.label}`,
					subject: { kind: "pregnancy", id: pregnancy.id },
				})
			}
			for (const child of getChildren(db, motherId)) {
				options.push({
					value: encode({ kind: "child", id: child.id }),
					label: `کودک: ${child.name}`,
					subject: { kind: "child", id: child.id },
				})
			}
		}
		return {
			db,
			mother,
			motherId,
			displayName: session?.displayName ?? "—",
			subjectOptions: options,
		}
	}, [db, motherId, session?.displayName])
}

export function useActivePregnancy() {
	const { db, motherId } = useMotherContext()
	return getActivePregnancy(db, motherId)
}
