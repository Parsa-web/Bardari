import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import type { AppDatabase } from "../../shared/types/domain"
import { databaseRepository } from "../../services/repositories/databaseRepository"

type DataContextValue = {
	db: AppDatabase | null
	loading: boolean
	error: string | null
	/** اعمال یک تابع تغییر خالص و ذخیرهسازی نتیجه */
	mutate: (fn: (db: AppDatabase) => AppDatabase) => Promise<void>
	resetDemoData: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
	const [db, setDb] = useState<AppDatabase | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const dbRef = useRef<AppDatabase | null>(null)

	useEffect(() => {
		let active = true
		databaseRepository
			.load()
			.then((loaded) => {
				if (!active) return
				dbRef.current = loaded
				setDb(loaded)
			})
			.catch(() => {
				if (active) setError("بارگذاری داده ناموفق بود.")
			})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
	}, [])

	const mutate = useCallback(async (fn: (current: AppDatabase) => AppDatabase) => {
		const current = dbRef.current
		if (!current) return
		try {
			const next = fn(current)
			dbRef.current = next
			setDb(next)
			setError(null)
			await databaseRepository.save(next)
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "ثبت تغییر ناموفق بود.")
			throw cause
		}
	}, [])

	const resetDemoData = useCallback(async () => {
		const fresh = await databaseRepository.reset()
		dbRef.current = fresh
		setDb(fresh)
		setError(null)
	}, [])

	const value = useMemo<DataContextValue>(
		() => ({ db, loading, error, mutate, resetDemoData }),
		[db, loading, error, mutate, resetDemoData],
	)

	return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
	const context = useContext(DataContext)
	if (!context) throw new Error("useData باید درون DataProvider استفاده شود.")
	return context
}

/** نسخه کوتاه برای صفحاتی که مطمئن هستند داده بارگذاری شده است. */
export function useDatabase(): AppDatabase {
	const { db } = useData()
	if (!db) throw new Error("داده هنوز بارگذاری نشده است.")
	return db
}
