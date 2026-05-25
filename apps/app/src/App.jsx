import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ApplyPage from "./pages/ApplyPage";
import VettingPage from "./pages/VettingPage";
import EducationPage from "./pages/EducationPage";
import ContractPage from "./pages/ContractPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/apply/:id/vetting" element={<VettingPage />} />
        <Route path="/apply/:id/education" element={<EducationPage />} />
        <Route path="/apply/:id/contract" element={<ContractPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
