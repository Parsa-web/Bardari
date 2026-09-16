import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter } from "react-router-dom"
import { App } from "./app/App"
import "./styles/tokens.css"
import "./styles/app.css"

const container = document.getElementById("root")
if (!container) throw new Error("عنصر ریشه پیدا نشد.")

// مسیردهی مبتنی بر Hash تا روی میزبانی ایستا (GitHub Pages) رفرش صفحه مشکلی ایجاد نکند.
createRoot(container).render(
	<StrictMode>
		<HashRouter>
			<App />
		</HashRouter>
	</StrictMode>,
)
