// src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";

import CoursesPage from "./pages/CoursesPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PlannerPage from "./pages/PlannerPage";
import PlannerViewPage from "./pages/PlannerViewPage";
import SignupPage from "./pages/SignupPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/planner/new" element={<PlannerPage />} />
      <Route path="/planner/:courseId" element={<PlannerViewPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;