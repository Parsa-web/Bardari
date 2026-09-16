import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import type { Role } from "../../shared/types/domain"
import { storageDriver } from "../../services/storage/storage"

export const SESSION_STORAGE_KEY = "mcc.session.v1"

/** احراز هویت دموست: فقط انتخاب نقش و پرونده، بدون رمز و بدون سرور. */
export type Session = {
	role: Role
	/** برای نقش مادر: پرونده فعال */
	motherId?: string | null
	/** برای ماما یا متخصص */
	providerId?: string | null
	displayName: string
}

type SessionContextValue = {
	session: Session | null
	ready: boolean
	signIn: (session: Session) => Promise<void>
	signOut: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null)
	const [ready, setReady] = useState(false)

	useEffect(() => {
		let active = true
		storageDriver
			.read<Session>(SESSION_STORAGE_KEY)
			.then((stored) => {
				if (active && stored) setSession(stored)
			})
			.finally(() => {
				if (active) setReady(true)
			})
		return () => {
			active = false
		}
	}, [])

	const signIn = useCallback(async (next: Session) => {
		setSession(next)
		await storageDriver.write(SESSION_STORAGE_KEY, next)
	}, [])

	const signOut = useCallback(async () => {
		setSession(null)
		await storageDriver.remove(SESSION_STORAGE_KEY)
	}, [])

	const value = useMemo<SessionContextValue>(
		() => ({ session, ready, signIn, signOut }),
		[session, ready, signIn, signOut],
	)

	return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
	const context = useContext(SessionContext)
	if (!context) throw new Error("useSession باید درون SessionProvider استفاده شود.")
	return context
}

export function useCurrentSession(): Session {
	const { session } = useSession()
	if (!session) throw new Error("نشست فعال وجود ندارد.")
	return session
}
