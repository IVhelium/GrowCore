import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../api/authApi";
import { updateUserProfile, uploadUserAvatar, deleteUserAvatar } from "../api/userApi";


const AuthContext = createContext(null);

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const loadCurrentUser = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            return currentUser;
        } catch (error) {
            if (error?.response?.status === 401) {
                setUser(null);
                return null;
            }

            throw error;
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            await loadCurrentUser();
        };

        init();
    }, [loadCurrentUser]);

    async function login(credentials) {
        await loginUser(credentials);
        return loadCurrentUser();
    }

    async function register(payload) {
        await registerUser(payload);

        return login({
            email: payload.email,
            password: payload.password,
        });
    }

    async function logout() {
        await logoutUser();
        setUser(null);
    }

    async function updateProfile(payload) {
        const updatedUser = await updateUserProfile(payload);
        setUser(updatedUser);
        return updatedUser;
    }

    async function uploadAvatar(file) {
        const updatedUser = await uploadUserAvatar(file);
        setUser(updatedUser);
        return updatedUser;
    }

    async function deleteAvatar() {
        const updatedUser = await deleteUserAvatar();
        setUser(updatedUser);
        return updatedUser;
    }

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            isAuthLoading,
            login,
            register,
            logout,
            updateProfile,
            uploadAvatar,
            deleteAvatar,
            reloadUser: loadCurrentUser,
        }),
        [user, isAuthLoading, loadCurrentUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}