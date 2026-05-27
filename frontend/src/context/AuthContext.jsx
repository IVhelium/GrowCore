import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../api/authApi";
import { updateUserProfile, uploadUserAvatar, deleteUserAvatar } from "../api/userApi";
import { AuthContext } from "./auth-context"



export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const loadCurrentUser = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            return currentUser;
        } catch (error) {
            setUser(null);

            if (error?.response?.status !== 401) {
                throw error;
            }
            
            return null;
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCurrentUser();
    }, [loadCurrentUser]);

    const login = useCallback( 
        async (credentials) => {
            await loginUser(credentials);
            return loadCurrentUser();
        },
        [loadCurrentUser]
    );

    const register = useCallback(
        async (payload) => {
            await registerUser(payload);

            return login({
                email: payload.email,
                password: payload.password,
            });
        },
        [login]
    );

    const logout = useCallback(
        async () => {
            await logoutUser();
            setUser(null);
        },
        []
    );

    const updateProfile = useCallback(
        async (payload) => {
            const updatedUser = await updateUserProfile(payload);
            setUser(updatedUser);
            return updatedUser;
        },
        []
    );

    const uploadAvatar = useCallback(
        async (file) => {
            const updatedUser = await uploadUserAvatar(file);
            setUser(updatedUser);
            return updatedUser;
        },
        []
    );

    const deleteAvatar = useCallback(
        async () => {
            const updatedUser = await deleteUserAvatar();
            setUser(updatedUser);
            return updatedUser;
        },
        []
    );

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
        [
            user, 
            isAuthLoading,
            login,
            register,
            logout,
            updateProfile,
            uploadAvatar,
            deleteAvatar, 
            loadCurrentUser,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
