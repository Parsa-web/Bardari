import { DataProvider } from "./providers/DataProvider"
import { SessionProvider } from "./providers/SessionProvider"
import { AppRoutes } from "./router/routes"

export function App() {
	return (
		<DataProvider>
			<SessionProvider>
				<AppRoutes />
			</SessionProvider>
		</DataProvider>
	)
}
