import type { ReactNode } from "react"

/**
 * مجموعه آیکن خطی هماهنگ (ضخامت ۱٫۶، اندازه ۲۰) برای تمام رابط کاربری.
 * در سراسر برنامه فقط از این آیکن‌ها استفاده می‌شود و هیچ ایموجی‌ای به‌عنوان آیکن به کار نمی‌رود.
 * در RTL هم درست دیده می‌شوند؛ آیکن‌های جهت‌دار با پرچم dir معکوس می‌شوند.
 */
export type IconName =
	| "home"
	| "user"
	| "pregnancy"
	| "activity"
	| "child"
	| "calendar"
	| "question"
	| "timeline"
	| "assistant"
	| "users"
	| "referral"
	| "bell"
	| "menu"
	| "close"
	| "sun"
	| "moon"
	| "logout"
	| "refresh"
	| "plus"
	| "check"
	| "info"
	| "alert"
	| "eye"
	| "eye-off"
	| "shield"
	| "heart"
	| "inbox"
	| "back"
	| "ruler"
	| "weight"
	| "leaf"
	| "message"
	| "image"

const PATHS: Record<IconName, ReactNode> = {
	home: <path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
	user: (
		<>
			<circle cx="12" cy="8" r="3.4" />
			<path d="M5 20c.9-3.4 3.6-5 7-5s6.1 1.6 7 5" />
		</>
	),
	pregnancy: (
		<>
			<circle cx="12" cy="12" r="8" />
			<path d="M12 8.5c2 1.5 2 5.5 0 7" />
		</>
	),
	activity: <path d="M3 12h4l2.5-6 3.5 12 2.5-6H21" />,
	child: (
		<>
			<circle cx="12" cy="9" r="3" />
			<path d="M8 20v-2.5a4 4 0 0 1 8 0V20" />
		</>
	),
	calendar: (
		<>
			<rect x="4" y="5.5" width="16" height="14" rx="2.5" />
			<path d="M8 3.5v4M16 3.5v4M4 10h16" />
		</>
	),
	question: (
		<>
			<path d="M20 15a3 3 0 0 1-3 3H9l-4 3v-5.5" />
			<path d="M5 15.5A3 3 0 0 1 4 13V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3" />
		</>
	),
	timeline: (
		<>
			<path d="M6 4v16" />
			<circle cx="6" cy="8.5" r="2" />
			<circle cx="6" cy="15.5" r="2" />
			<path d="M10 8.5h9M10 15.5h6" />
		</>
	),
	assistant: (
		<>
			<rect x="4" y="7" width="16" height="11" rx="3" />
			<path d="M12 4v3M9 12h.01M15 12h.01M10 15.5h4" />
		</>
	),
	users: (
		<>
			<circle cx="9" cy="8.5" r="3" />
			<path d="M3 19c.8-2.9 3-4.3 6-4.3s5.2 1.4 6 4.3" />
			<path d="M16 6.2a3 3 0 0 1 0 5.6M18 19c-.3-1.6-.9-2.8-1.8-3.7" />
		</>
	),
	referral: (
		<>
			<path d="M7 7h7l-2.5-2.5M17 17h-7l2.5 2.5" />
			<path d="M7 7v4a3 3 0 0 0 3 3h7" />
		</>
	),
	bell: (
		<>
			<path d="M18 15V11a6 6 0 1 0-12 0v4l-1.5 2.5h15z" />
			<path d="M10 20h4" />
		</>
	),
	menu: <path d="M4 7h16M4 12h16M4 17h16" />,
	close: <path d="M6 6l12 12M18 6 6 18" />,
	sun: (
		<>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
		</>
	),
	moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />,
	logout: (
		<>
			<path d="M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
			<path d="M10 8.5 6.5 12l3.5 3.5M6.5 12H15" />
		</>
	),
	refresh: (
		<>
			<path d="M19 11a7 7 0 1 0-2.1 5.3" />
			<path d="M19 5.5V11h-5" />
		</>
	),
	plus: <path d="M12 5.5v13M5.5 12h13" />,
	check: <path d="M5 12.5 9.5 17 19 7.5" />,
	info: (
		<>
			<circle cx="12" cy="12" r="8.5" />
			<path d="M12 11v5M12 8h.01" />
		</>
	),
	alert: (
		<>
			<path d="M12 4.5 21 19H3z" />
			<path d="M12 10v4M12 16.5h.01" />
		</>
	),
	eye: (
		<>
			<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" />
			<circle cx="12" cy="12" r="2.8" />
		</>
	),
	"eye-off": (
		<>
			<path d="M4 4l16 16" />
			<path d="M9.5 9.6A2.8 2.8 0 0 0 12 14.8c.7 0 1.4-.3 1.9-.7" />
			<path d="M6.3 7.3C4 8.9 2.5 12 2.5 12s3.5 5.5 9.5 5.5c1.6 0 3-.4 4.2-1M17.4 15.2c2.4-1.7 4.1-3.2 4.1-3.2S18 6.5 12 6.5c-.7 0-1.4.1-2 .2" />
		</>
	),
	shield: <path d="M12 4 19 6.5v5c0 4-3 7-7 8.5-4-1.5-7-4.5-7-8.5v-5z" />,
	heart: <path d="M12 19s-7-4.2-7-9a3.8 3.8 0 0 1 7-2.1A3.8 3.8 0 0 1 19 10c0 4.8-7 9-7 9z" />,
	inbox: (
		<>
			<path d="M4 13h4l1.5 3h5L16 13h4" />
			<path d="M4 13 6.5 5.5h11L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
		</>
	),
	back: <path d="M9.5 5 16 12l-6.5 7" />,
	ruler: (
		<>
			<rect x="2.8" y="8.5" width="18.4" height="7" rx="1.8" />
			<path d="M7 8.5v3M11 8.5v4M15 8.5v3M19 8.5v4" />
		</>
	),
	weight: (
		<>
			<path d="M5.6 8h12.8l1.6 11a1.5 1.5 0 0 1-1.5 1.7H5.5A1.5 1.5 0 0 1 4 19z" />
			<circle cx="12" cy="6" r="2.4" />
		</>
	),
	leaf: (
		<>
			<path d="M5 19c-1.5-6 2.5-11 14-11 0 8-4.5 12-10.5 11.4" />
			<path d="M5 19c3-3.5 6-5.6 9.5-7" />
		</>
	),
	message: (
		<>
			<rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
			<path d="m4.5 8 7.5 5 7.5-5" />
		</>
	),
	image: (
		<>
			<rect x="3.5" y="5" width="17" height="14" rx="2.5" />
			<circle cx="9" cy="10" r="1.6" />
			<path d="m4.5 17 4.5-4 3.5 3 3-2.5 4 3.5" />
		</>
	),
}

/** آیکن‌های جهت‌دار باید در چیدمان راست‌به‌چپ قرینه شوند. */
const MIRRORED: ReadonlySet<IconName> = new Set<IconName>(["back", "logout", "referral"])

export function Icon({
	name,
	size = 20,
	className,
}: {
	name: IconName
	size?: number
	className?: string
}) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.6}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
			className={className}
			style={MIRRORED.has(name) ? { transform: "scaleX(-1)" } : undefined}
		>
			{PATHS[name]}
		</svg>
	)
}
