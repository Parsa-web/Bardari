import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"

export type ThemeName = "light" | "dark"

const THEME_KEY = "mcc.theme.v1"

type ThemeContextValue = {
	theme: ThemeName
	toggleTheme: () => void
	setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readInitialTheme(): ThemeName {
	if (typeof window === "undefined") return "light"
	try {
		const stored = window.localStorage.getItem(THEME_KEY)
		if (stored === "light" || stored === "dark") return stored
	} catch {
		/* دسترسی به حافظه مرورگر ممکن نبود؛ از تم سیستم استفاده می‌کنیم. */
	}
	return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

/** تم روشن/تاریک را روی ریشه سند اعمال و در مرورگر ذخیره می‌کند. */
export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<ThemeName>(readInitialTheme)

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme)
		try {
			window.localStorage.setItem(THEME_KEY, theme)
		} catch {
			/* ذخیره‌سازی تم اختیاری است. */
		}
	}, [theme])

	const setTheme = useCallback((next: ThemeName) => setThemeState(next), [])
	const toggleTheme = useCallback(
		() => setThemeState((current) => (current === "dark" ? "light" : "dark")),
		[],
	)

	const value = useMemo<ThemeContextValue>(
		() => ({ theme, toggleTheme, setTheme }),
		[theme, toggleTheme, setTheme],
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext)
	if (!context) throw new Error("useTheme باید درون ThemeProvider استفاده شود.")
	return context
}
