import { useContext } from "react";
import { AuthContext } from "../context/auth-context";


export function useAuth() {
    // Returns authentication state and actions from the nearest AuthProvider.
    const context = useContext(AuthContext);

    if (!context) { // Prevents useAuth from being called outside its provider.
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}
