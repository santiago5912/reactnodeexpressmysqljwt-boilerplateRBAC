import { useCallback, useMemo } from "react";
import { useAuthContext } from "./useCustomContext";
import useAxiosInstance from "../config/axiosInstance";
import { ApiResponse } from "../../../types/ApiResponse";
import { useLogoutRedirect } from "../hooks/logoutRedirect";

// This hook is used to verify the user's token. It performs the following actions:
// 1. It sets the loading state to true before starting the verification process.
// 2. It makes an API call to the "/auth/verifyToken" endpoint using the axios instance, passing the access token in the Authorization header.
// 3. If the response contains valid user data and an access token, 
// it updates the authentication context with the new user data and access token, and sets the authentication state to true. 
export const useVerifyToken = () => {
  const logoutRedirect = useLogoutRedirect();

  const { setIsAuth, setUser, setAccessToken, accessToken, setIsLoading } =
    useAuthContext();

  const createAxiosInstance = useAxiosInstance();
  const axiosInstance = useMemo(createAxiosInstance, [
    setAccessToken,
    createAxiosInstance,
  ]);

  const verifyToken = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get<ApiResponse>(
        "/auth/verifyToken",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response?.data) {
        const accessTok = response.data.auth?.accessToken;
        const userData = response.data.auth?.user;
        if (accessTok && userData) {
          setUser(userData);
          setAccessToken(accessTok);
          setIsAuth(true);
        } else {
          setUser(null);
          setAccessToken("");
          setIsAuth(false);
          logoutRedirect();
        }
      } else {
        setUser(null);
        setAccessToken("");
        setIsAuth(false);
        logoutRedirect();
      }
    } catch (error) {
      console.error("Failed to verify token", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    logoutRedirect,
    accessToken,
    setIsAuth,
    setIsLoading,
    setUser,
    setAccessToken,
    axiosInstance,
  ]);

  return verifyToken;
};
