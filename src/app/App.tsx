import { DataProvider } from "./providers/DataProvider"
import { SessionProvider } from "./providers/SessionProvider"
import { ThemeProvider } from "./providers/ThemeProvider"
import { AppRoutes } from "./router/routes"

export function App() {
	return (
		<ThemeProvider>
			<DataProvider>
				<SessionProvider>
					<AppRoutes />
				</SessionProvider>
			</DataProvider>
		</ThemeProvider>
	)
}
