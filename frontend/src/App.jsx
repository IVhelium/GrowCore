import { Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProtectedRoute from "./routes/ProtectedRoute.jsx";



function App() {

  return (
    <Routes>
      <Route element={<MainLayout />}>
        
      </Route>

      <Route element={<ProtectedRoute/>}>

      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App
