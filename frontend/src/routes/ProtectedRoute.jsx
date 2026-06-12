import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";


export default function ProtectedRoute() {
    const { isAuthenticated , isAuthLoading } = useAuth();
    const location = useLocation();

    if (isAuthLoading) {
      return (
        <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">
          Loading account...
        </div>
      );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet/>
}