import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../api/authApi";
import { updateUserProfile, uploadUserAvatar, deleteUserAvatar } from "../api/userApi";
import { AuthContext } from "./auth-context"



export default function AuthProvider({ children }) {
    // Provides the current user and account actions to the whole application.
    const [user, setUser] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    const loadCurrentUser = useCallback(async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
            return currentUser;
        } catch (error) {
            setUser(null);

            if (error?.response?.status !== 401) { // A 401 simply means that the visitor is signed out.
                throw error;
            }
            
            return null;
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadCurrentUser();
    }, [loadCurrentUser]);

    const login = useCallback( 
        async (credentials) => {
            // Sign in first, then load the full profile saved in the session.
            await loginUser(credentials);
            return loadCurrentUser();
        },
        [loadCurrentUser]
    );

    const register = useCallback(
        async (payload) => {
            // Creates the account and signs in immediately with the new credentials.
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
            // Removes the server session and clears the user stored in React state.
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
        // Prevents unnecessary re-renders when none of the shared values changed.
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
