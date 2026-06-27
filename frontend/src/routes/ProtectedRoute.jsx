import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";


export default function ProtectedRoute() {
    // Shows nested routes only after the application knows whether a user is signed in.
    const { isAuthenticated , isAuthLoading } = useAuth();
    const location = useLocation();

    if (isAuthLoading) { // Prevents an incorrect redirect while the session is loading.
      return (
        <div className="grid min-h-[50vh] place-items-center text-sm text-slate-500">
          Loading account...
        </div>
      );
    }

    if (!isAuthenticated) { // Sends guests to login and remembers their requested page.
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return <Outlet/>
}
