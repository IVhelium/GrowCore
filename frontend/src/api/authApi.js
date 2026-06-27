import { apiClient } from "./apiClient";


export async function registerUser(payload) {
    // Sends account details to the backend to create a new user.
    const { data } = await apiClient.post("/auths/register", {
        username: payload.username,
        email: payload.email,
        password: payload.password,
    });
    return data;   
}

export async function loginUser(payload) {
    // Sends credentials to start a browser session with authentication cookies.
    const { data } = await apiClient.post("/auths/login", {
        email: payload.email,
        password: payload.password,
    })
    return data;
}

export async function logoutUser() {
    // Ends the current session and clears its authentication cookies.
    const { data } = await apiClient.post("/auths/logout");
    return data;
}

export async function getCurrentUser() {
    // Requests the account linked to the current access token.
    const { data } = await apiClient.get("/auths/me");
    return data;
}
