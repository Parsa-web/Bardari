import { useData } from "../../app/providers/DataProvider"
import { useSession } from "../../app/providers/SessionProvider"
import type { AppDatabase } from "../../shared/types/domain"

export function useProviderSession(): {
	db: AppDatabase
	providerId: string
	displayName: string
} {
	const { db } = useData()
	const { session } = useSession()
	if (!db) throw new Error("داده بارگذاری نشده است.")
	return {
		db,
		providerId: session?.providerId ?? "",
		displayName: session?.displayName ?? "مراقب سلامت",
	}
}
