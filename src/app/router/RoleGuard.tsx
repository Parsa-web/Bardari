import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import type { Role } from "../../shared/types/domain"
import { useSession } from "../providers/SessionProvider"
import { Spinner } from "../../shared/components/ui"

/** فقط نقش مجاز می‌تواند مسیر را ببیند؛ این یک کنترل نمایشی است، نه امنیت واقعی. */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
	const { session, ready } = useSession()
	if (!ready) return <Spinner />
	if (!session) return <Navigate to="/login" replace />
	if (session.role !== role) return <Navigate to={`/${session.role}`} replace />
	return <>{children}</>
}
