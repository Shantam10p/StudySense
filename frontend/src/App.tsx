// src/App.tsx
import { Navigate, Route, Routes } from "react-router-dom";

import CoursesPage from "./pages/CoursesPage";
import PlannerPage from "./pages/PlannerPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<CoursesPage />} />
      <Route path="/planner" element={<PlannerPage />} />
      <Route path="/planner/:courseId" element={<PlannerPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;