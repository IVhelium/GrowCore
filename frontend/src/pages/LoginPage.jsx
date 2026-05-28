import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getApiError } from "./../utils/getApiError";
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogin(data) {
    setIsLoading(true);
    setError("");

    try {
      await login(data);
      navigate(location.state?.from?.pathname || "/profile", { replace: true });
    } catch (requestError) {
      setError(getApiError(requestError, "Unable to sign in"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-center text-3xl font-bold tracking-tight text-slate-950">
        Sign in
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        Sign in to manage your profile and saved GrowCore components
      </p>

      <div className="mt-8">
        <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account?{" "}
        <Link to="/register" className="font-semibold text-[#4F8A5B]">
          Create account
        </Link>
      </p>
    </div>
  );
}
