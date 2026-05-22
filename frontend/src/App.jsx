import { Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import Header from "./components/layout/Header";
import { PackageSearch } from "lucide-react";



function App() {

  return (
    // <Routes>
    //   <Route element={<MainLayout />}>
        
    //   </Route>

    //   <Route element={<ProtectedRoute/>}>

    //   </Route>

    //   <Route path="*" element={<NotFoundPage />} />
    // </Routes>
    <>
      <Header/>
      <PackageSearch/>
    </>
  );
}

export default App
