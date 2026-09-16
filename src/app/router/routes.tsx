import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "../layouts/AppLayout"
import { RoleGuard } from "./RoleGuard"
import { LoginPage } from "../../features/auth/LoginPage"
import { MotherDashboard } from "../../features/mother/MotherDashboard"
import { MotherProfilePage } from "../../features/mother/MotherProfilePage"
import { PregnanciesPage } from "../../features/mother/PregnanciesPage"
import { ActivitiesPage } from "../../features/mother/ActivitiesPage"
import { ChildrenPage } from "../../features/mother/ChildrenPage"
import { MotherCheckupsPage } from "../../features/mother/MotherCheckupsPage"
import { MotherQuestionsPage } from "../../features/mother/MotherQuestionsPage"
import { TimelinePage } from "../../features/mother/TimelinePage"
import { AssistantPage } from "../../features/chatbot/AssistantPage"
import { MidwifeDashboard } from "../../features/midwife/MidwifeDashboard"
import { MidwifeMothersPage } from "../../features/midwife/MidwifeMothersPage"
import { MidwifeQuestionsPage } from "../../features/midwife/MidwifeQuestionsPage"
import { MidwifeCheckupsPage } from "../../features/midwife/MidwifeCheckupsPage"
import { MidwifeReferralsPage } from "../../features/midwife/MidwifeReferralsPage"
import { SpecialistDashboard } from "../../features/specialist/SpecialistDashboard"
import { SpecialistReferralsPage } from "../../features/specialist/SpecialistReferralsPage"

export function AppRoutes() {
	return (
		<Routes>
			<Route path="/login" element={<LoginPage />} />

			<Route
				path="/mother"
				element={
					<RoleGuard role="mother">
						<AppLayout />
					</RoleGuard>
				}
			>
				<Route index element={<MotherDashboard />} />
				<Route path="profile" element={<MotherProfilePage />} />
				<Route path="pregnancies" element={<PregnanciesPage />} />
				<Route path="activities" element={<ActivitiesPage />} />
				<Route path="children" element={<ChildrenPage />} />
				<Route path="checkups" element={<MotherCheckupsPage />} />
				<Route path="questions" element={<MotherQuestionsPage />} />
				<Route path="timeline" element={<TimelinePage />} />
				<Route path="assistant" element={<AssistantPage />} />
				<Route path="*" element={<Navigate to="/mother" replace />} />
			</Route>

			<Route
				path="/midwife"
				element={
					<RoleGuard role="midwife">
						<AppLayout />
					</RoleGuard>
				}
			>
				<Route index element={<MidwifeDashboard />} />
				<Route path="mothers" element={<MidwifeMothersPage />} />
				<Route path="questions" element={<MidwifeQuestionsPage />} />
				<Route path="checkups" element={<MidwifeCheckupsPage />} />
				<Route path="referrals" element={<MidwifeReferralsPage />} />
				<Route path="*" element={<Navigate to="/midwife" replace />} />
			</Route>

			<Route
				path="/specialist"
				element={
					<RoleGuard role="specialist">
						<AppLayout />
					</RoleGuard>
				}
			>
				<Route index element={<SpecialistDashboard />} />
				<Route path="referrals" element={<SpecialistReferralsPage />} />
				<Route path="*" element={<Navigate to="/specialist" replace />} />
			</Route>

			<Route path="*" element={<Navigate to="/login" replace />} />
		</Routes>
	)
}
