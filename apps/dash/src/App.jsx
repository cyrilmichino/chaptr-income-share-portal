import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ApplicationsPage from "./pages/ApplicationsPage";
import ApplicationDetailPage from "./pages/ApplicationDetailPage";
import ContractsPage from "./pages/ContractsPage";
import SettlementsPage from "./pages/SettlementsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ApplicationsPage />} />
        <Route path="/applications/:id" element={<ApplicationDetailPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/settlements" element={<SettlementsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
