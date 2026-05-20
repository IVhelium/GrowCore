import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../api/authApi";


export function useAuth() {
    const queryClient = useQueryClient();

    const currentUserQuery = useQuery({
        queryKey: ["current-user"],
        queryFn: getCurrentUser,
        retry: false,
    });

    const loginMutation = useMutation({
        mutationFn: loginUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["current-user"] });
        },
    });

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["current-user"] });
        },
    });

    const logoutMutation = useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            queryClient.setQueryData(["current-user"], null);
        },
    });

    return {
      user: currentUserQuery.data,
      isAuth: Boolean(currentUserQuery.data),
      isUserLoading: currentUserQuery.isLoading,

      login: loginMutation.mutateAsync,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,

      isLoginLoading: loginMutation.isPending,
      isRegisterLoading: registerMutation.isPending,
      isLogoutLoading: logoutMutation.isPending,
    };
}