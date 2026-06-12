import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useAutoDismissMessage } from "../hooks/useAutoDismissMessage";
import { Link, useNavigate } from "react-router-dom";
import { getApiError } from "../utils/getApiError";
import RegisterForm from "../components/auth/RegisterForm";


export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useAutoDismissMessage("");
    const { register } = useAuth();
    const navigate = useNavigate();

    async function handleRegister(data) {
        setIsLoading(true);
        setError("");

        try {
            await register(data);
            navigate("/profile", { replace: true });
        } catch (requestError) {
            setError(getApiError(requestError, "Unable to create account"));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div>
            <h1 className="text-center text-3xl font-bold tracking-tight text-slate-950">Create account</h1>
            <p className="mt-2 text-center text-sm text-slate-500">
                Redister to save parts, upload an avatar, and manage your GrowCore profile
            </p>

            <div className="mt-8">
                <RegisterForm onSubmit={handleRegister} isLoading={isLoading} error={error}/>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-[#4F8A5B]">
                    Sign in
                </Link>
            </p>
        </div>
    );
}
