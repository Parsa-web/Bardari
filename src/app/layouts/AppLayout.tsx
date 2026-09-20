import { useEffect, useMemo, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { useData } from "../providers/DataProvider"
import { useSession } from "../providers/SessionProvider"
import { useTheme } from "../providers/ThemeProvider"
import { ROLE_LABELS } from "../../shared/constants/labels"
import { getNotifications, unreadCount } from "../../services/selectors"
import { markAllNotificationsRead, markNotificationRead } from "../../services/mutations"
import {
	Alert,
	Badge,
	Button,
	Drawer,
	EmptyState,
	Icon,
	IconButton,
	LoadingState,
} from "../../shared/components/ui"
import type { IconName } from "../../shared/components/ui"
import { formatTimestamp } from "../../shared/utils/date"

type NavItem = { to: string; label: string; icon: IconName; group: string }

// ساختار ناوبری مادر در شش دسته روشن: خانه، بارداری، فعالیت‌ها، سلامت، ارتباط با ماما، پروفایل.
const NAV: Record<string, NavItem[]> = {
	mother: [
		{ to: "/mother", label: "خانه", icon: "home", group: "خانه" },
		{ to: "/mother/pregnancies", label: "بارداری من", icon: "pregnancy", group: "بارداری" },
		{ to: "/mother/pregnancy-checkups", label: "چکاپ بارداری", icon: "check", group: "بارداری" },
		{ to: "/mother/timeline", label: "خط زمانی", icon: "timeline", group: "بارداری" },
		{ to: "/mother/daily-activities", label: "برنامه و روتین‌ها", icon: "activity", group: "فعالیت‌ها" },
		{ to: "/mother/activities", label: "دفترچه فعالیت", icon: "activity", group: "فعالیت‌ها" },
		{ to: "/mother/health", label: "وضعیت سلامت", icon: "heart", group: "سلامت" },
		{ to: "/mother/appointments", label: "نوبت‌ها", icon: "calendar", group: "سلامت" },
		{ to: "/mother/checkups", label: "چکاپ و واکسن", icon: "calendar", group: "سلامت" },
		{ to: "/mother/children", label: "کودکان", icon: "child", group: "سلامت" },
		{ to: "/mother/child-health", label: "سلامت کودک", icon: "child", group: "سلامت" },
		{ to: "/mother/questions", label: "سؤال از ماما", icon: "question", group: "ارتباط با ماما" },
		{ to: "/mother/assistant", label: "دستیار مراقبت", icon: "assistant", group: "ارتباط با ماما" },
		{ to: "/mother/profile", label: "پروفایل من", icon: "user", group: "پروفایل" },
	],
	midwife: [
		{ to: "/midwife", label: "خانه", icon: "home", group: "مرور کلی" },
		{ to: "/midwife/mothers", label: "مادران تحت مراقبت", icon: "users", group: "پرونده‌ها" },
		{ to: "/midwife/questions", label: "سؤال‌ها", icon: "question", group: "پرونده‌ها" },
		{ to: "/midwife/checkups", label: "چکاپ‌ها", icon: "calendar", group: "پرونده‌ها" },
		{ to: "/midwife/referrals", label: "ارجاع‌ها", icon: "referral", group: "پیگیری" },
	],
	specialist: [
		{ to: "/specialist", label: "خانه", icon: "home", group: "مرور کلی" },
		{ to: "/specialist/referrals", label: "ارجاع‌های دریافتی", icon: "referral", group: "پیگیری" },
	],
}

const ROLE_TAGLINE: Record<string, string> = {
	mother: "پرونده مراقبت من",
	midwife: "میز کار ماما",
	specialist: "میز کار متخصص",
}

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).slice(0, 2)
	return parts.map((part) => part.charAt(0)).join("") || "؟"
}

export function AppLayout() {
	const { session, signOut } = useSession()
	const { db, loading, error, mutate, resetDemoData } = useData()
	const { theme, toggleTheme } = useTheme()
	const navigate = useNavigate()
	const location = useLocation()
	const [notifOpen, setNotifOpen] = useState(false)
	const [navOpen, setNavOpen] = useState(false)

	// با جابجایی مسیر، ناوبری کشویی موبایل بسته می‌شود.
	useEffect(() => {
		setNavOpen(false)
	}, [location.pathname])

	const notifications = useMemo(() => {
		if (!db || !session) return []
		return getNotifications(db, session.role, session.motherId ?? null)
	}, [db, session])

	if (loading || !session || !db)
		return (
			<main className="content">
				<LoadingState rows={2} />
			</main>
		)

	const items = NAV[session.role] ?? []
	const unread = unreadCount(notifications)
	const groups = items.reduce<Array<{ title: string; items: NavItem[] }>>((acc, item) => {
		const last = acc[acc.length - 1]
		if (last && last.title === item.group) last.items.push(item)
		else acc.push({ title: item.group, items: [item] })
		return acc
	}, [])
	const current = [...items]
		.sort((a, b) => b.to.length - a.to.length)
		.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))

	const navigation = (
		<nav className="nav" aria-label="فهرست بخش‌ها">
			{groups.map((group) => (
				<div className="nav__group" key={group.title}>
					<span className="nav__group-title">{group.title}</span>
					{group.items.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.to === `/${session.role}`}
							className={({ isActive }) => `nav__item${isActive ? " nav__item--active" : ""}`}
						>
							<span className="nav__icon">
								<Icon name={item.icon} size={19} />
							</span>
							<span>{item.label}</span>
						</NavLink>
					))}
				</div>
			))}
		</nav>
	)

	const brand = (
		<div className="brand">
			<span className="brand__mark">
				<Icon name="heart" size={21} />
			</span>
			<span className="brand__text">
				<span className="brand__title">مراقبت مادر و کودک</span>
				<span className="brand__sub">{ROLE_TAGLINE[session.role] ?? "سامانه مراقبت"}</span>
			</span>
		</div>
	)

	const resetButton = (
		<Button
			variant="ghost"
			icon="refresh"
			block
			onClick={() => {
				void resetDemoData()
			}}
			title="بازگرداندن داده نمایشی به حالت اول"
		>
			بازنشانی داده نمایشی
		</Button>
	)

	return (
		<div className="shell">
			<aside className="shell__side">
				{brand}
				{navigation}
				<div className="side-foot">{resetButton}</div>
			</aside>

			<div className="shell__main">
				<header className="topbar">
					<div className="topbar__start">
						<IconButton
							icon="menu"
							label="فهرست بخش‌ها"
							className="icon-btn--nav"
							onClick={() => setNavOpen(true)}
						/>
						<span className="topbar__context">
							<span className="topbar__title">{current?.label ?? "خانه"}</span>
							<span className="topbar__sub">{ROLE_TAGLINE[session.role] ?? "سامانه مراقبت"}</span>
						</span>
					</div>
					<div className="topbar__actions">
						<IconButton
							icon={theme === "dark" ? "sun" : "moon"}
							label={theme === "dark" ? "تم روشن" : "تم تاریک"}
							onClick={toggleTheme}
						/>
						<IconButton
							icon="bell"
							label="مرکز اعلان‌ها"
							badge={unread}
							onClick={() => setNotifOpen(true)}
						/>
						<span className="user-chip">
							<span className="avatar" aria-hidden="true">
								{initials(session.displayName)}
							</span>
							<span className="user-chip__text">
								<span className="user-chip__name">{session.displayName}</span>
								<span className="user-chip__role">{ROLE_LABELS[session.role]}</span>
							</span>
						</span>
						<IconButton
							icon="logout"
							label="خروج و تعویض نقش"
							onClick={() => {
								void signOut().then(() => navigate("/login", { replace: true }))
							}}
						/>
					</div>
				</header>

				<main className="content">
					{error && <Alert tone="danger">{error}</Alert>}
					<Outlet />
				</main>
			</div>

			<Drawer open={navOpen} title="بخش‌ها" side="start" onClose={() => setNavOpen(false)} footer={resetButton}>
				{brand}
				{navigation}
			</Drawer>

			<Drawer
				open={notifOpen}
				title="مرکز اعلان‌ها"
				onClose={() => setNotifOpen(false)}
				footer={
					<Button
						variant="outline"
						block
						icon="check"
						disabled={unread === 0}
						onClick={() => {
							void mutate((cur) => markAllNotificationsRead(cur, session.role, session.motherId ?? null))
						}}
					>
						علامت‌زدن همه به عنوان خوانده‌شده
					</Button>
				}
			>
				{notifications.length === 0 ? (
					<EmptyState
						icon="bell"
						title="اعلانی برای نمایش نیست"
						hint="یادآوری چکاپ‌ها، پاسخ سؤال‌ها و وضعیت ارجاع‌ها در این بخش نشان داده می‌شود."
					/>
				) : (
					<ul className="notif__list">
						{notifications.map((item) => (
							<li key={item.id} className={`notif__item${item.read ? "" : " notif__item--unread"}`}>
								<span className="notif__title">
									{!item.read && <span className="notif__unread-dot" aria-hidden="true" />}
									{item.title}
									{!item.read && <Badge tone="info">خوانده‌نشده</Badge>}
								</span>
								<p className="notif__body">{item.body}</p>
								<span className="meta">{formatTimestamp(item.createdAt)}</span>
								<div className="notif__item-actions">
									{item.link && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												setNotifOpen(false)
												navigate(item.link as string)
											}}
										>
											مشاهده
										</Button>
									)}
									{!item.read && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() => {
												void mutate((cur) => markNotificationRead(cur, item.id))
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
			</Drawer>
		</div>
	)
}
