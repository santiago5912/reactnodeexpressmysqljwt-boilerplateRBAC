import { useCallback, useMemo } from "react";
import { useAuthContext } from "./useCustomContext";
import useAxiosInstance from "../config/axiosInstance";
import { useLogoutRedirect } from "./logoutRedirect";

// This hook is used to handle the logout process for the user. It performs the following actions:
// 1. It makes an API call to the "/auth/logout" endpoint using the axios instance to log the user out on the server side.
// 2. It clears the user data, access token, and authentication state in the authentication context.
// 3. It redirects the user to the appropriate login page based on their role using the useLogoutRedirect hook.     
export const useLogout = () => {
  const logoutRedirect = useLogoutRedirect();
  const { setIsAuth, setUser, setAccessToken } = useAuthContext();

  const createAxiosInstance = useAxiosInstance();
  const axiosInstance = useMemo(createAxiosInstance, [
    setAccessToken,
    createAxiosInstance,
  ]);

  const logout = useCallback(async () => {
    await axiosInstance.get("/auth/logout", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    setUser(null);
    setAccessToken("");
    setIsAuth(false);
    logoutRedirect();
  }, [logoutRedirect, axiosInstance, setIsAuth, setUser, setAccessToken]);

  return logout;
};
