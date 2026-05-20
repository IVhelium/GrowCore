import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";


export default function ProtectedRoute() {
    const { isAuth ,isUserLoading } = useAuth();

    if (isUserLoading) {
        return (
            <div className="grid min-h-[60vh] place-items-center text-slate-500">
                Verify Autorization...
            </div>
        );
    }

    if (!isAuth) {
        return <Navigate to="/auth/login" replace />;
    }

    return <Outlet/>
}