import { useMemo, useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useData } from "../providers/DataProvider"
import { useSession } from "../providers/SessionProvider"
import { ROLE_LABELS } from "../../shared/constants/labels"
import { getNotifications, unreadCount } from "../../services/selectors"
import { markAllNotificationsRead, markNotificationRead } from "../../services/mutations"
import { Badge, Button, EmptyState, Spinner } from "../../shared/components/ui"
import { formatTimestamp } from "../../shared/utils/date"

type NavItem = { to: string; label: string }

const NAV: Record<string, NavItem[]> = {
	mother: [
		{ to: "/mother", label: "خانه" },
		{ to: "/mother/profile", label: "پروفایل من" },
		{ to: "/mother/pregnancies", label: "بارداری‌ها" },
		{ to: "/mother/activities", label: "فعالیت روزانه" },
		{ to: "/mother/children", label: "کودکان" },
		{ to: "/mother/checkups", label: "چکاپ‌ها" },
		{ to: "/mother/questions", label: "سؤال از ماما" },
		{ to: "/mother/timeline", label: "خط زمانی" },
		{ to: "/mother/assistant", label: "دستیار مراقبت" },
	],
	midwife: [
		{ to: "/midwife", label: "خانه" },
		{ to: "/midwife/mothers", label: "مادران تحت مراقبت" },
		{ to: "/midwife/questions", label: "سؤال‌ها" },
		{ to: "/midwife/checkups", label: "چکاپ‌ها" },
		{ to: "/midwife/referrals", label: "ارجاع‌ها" },
	],
	specialist: [
		{ to: "/specialist", label: "خانه" },
		{ to: "/specialist/referrals", label: "ارجاع‌های دریافتی" },
	],
}

export function AppLayout() {
	const { session, signOut } = useSession()
	const { db, loading, error, mutate, resetDemoData } = useData()
	const navigate = useNavigate()
	const [panelOpen, setPanelOpen] = useState(false)

	const notifications = useMemo(() => {
		if (!db || !session) return []
		return getNotifications(db, session.role, session.motherId ?? null)
	}, [db, session])

	if (loading) return <Spinner />
	if (!session || !db) return <Spinner label="در حال آماده‌سازی…" />

	const items = NAV[session.role] ?? []
	const unread = unreadCount(notifications)

	return (
		<div className="shell">
			<aside className="shell__side">
				<div className="brand">
					<span className="brand__mark">ممک</span>
					<span className="brand__text">سامانه مراقبت مادر و کودک</span>
				</div>
				<nav className="nav">
					{items.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.to === `/${session.role}`}
							className={({ isActive }) => `nav__item${isActive ? " nav__item--active" : ""}`}
						>
							{item.label}
						</NavLink>
					))}
				</nav>
				<div className="side-foot">
					<Button
						variant="ghost"
						onClick={() => {
							void resetDemoData()
						}}
						title="بازگرداندن داده نمایشی به حالت اول"
					>
						بازنشانی داده دمو
					</Button>
				</div>
			</aside>

			<div className="shell__main">
				<header className="topbar">
					<div className="topbar__user">
						<strong>{session.displayName}</strong>
						<Badge tone="info">{ROLE_LABELS[session.role]}</Badge>
					</div>
					<div className="topbar__actions">
						<Button variant="ghost" onClick={() => setPanelOpen((open) => !open)}>
							اعلان‌ها{unread > 0 ? ` (${unread})` : ""}
						</Button>
						<Button
							variant="secondary"
							onClick={() => {
								void signOut().then(() => navigate("/login", { replace: true }))
							}}
						>
							تعویض نقش
						</Button>
					</div>
				</header>

				{panelOpen && (
					<div className="notif">
						<div className="notif__head">
							<strong>مرکز اعلان‌ها</strong>
							<Button
								variant="ghost"
								disabled={unread === 0}
								onClick={() => {
									void mutate((current) =>
										markAllNotificationsRead(current, session.role, session.motherId ?? null),
									)
								}}
							>
								علامت‌زدن همه به عنوان خوانده‌شده
							</Button>
						</div>
						{notifications.length === 0 ? (
							<EmptyState title="اعلانی وجود ندارد." />
						) : (
							<ul className="notif__list">
								{notifications.map((item) => (
									<li key={item.id} className={`notif__item${item.read ? "" : " notif__item--unread"}`}>
										<div>
											<strong>{item.title}</strong>
											<p>{item.body}</p>
											<span className="muted">{formatTimestamp(item.createdAt)}</span>
										</div>
										<div className="notif__item-actions">
											{item.link && (
												<Button
													variant="ghost"
													onClick={() => {
														setPanelOpen(false)
														navigate(item.link as string)
													}}
												>
													مشاهده
												</Button>
											)}
											{!item.read && (
												<Button
													variant="ghost"
													onClick={() => {
														void mutate((current) => markNotificationRead(current, item.id))
													}}
												>
													خواندم
												</Button>
											)}
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				)}

				{error && <div className="alert alert--danger">{error}</div>}

				<main className="content">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
