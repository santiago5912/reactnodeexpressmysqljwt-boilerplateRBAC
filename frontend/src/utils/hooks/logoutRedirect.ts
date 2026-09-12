import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { convertToRoleData } from "../globals";

// This hook is used to redirect the user to the login page based on their role after logout 
// or token verification failure. It uses the current location to determine the user's role and constructs the appropriate login URL for redirection.
export const useLogoutRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // The useCallback hook is used to memoize the redirect function, ensuring that it doesn't get recreated on every render 
  // unless the dependencies (location and navigate) change.
  // The redirect function checks the current pathname to extract the role slug, constructs the login URL based on that role,
  // and navigates to the login page if the current pathname is different from the constructed login URL.   
  // const cachedFn = useCallback(fn, dependencies)    
  return useCallback(() => {
    const urlSlug =
      location.pathname.split("/") && location.pathname.split("/")[1]
        ? location.pathname.split("/")[1]
        : "";

        // Construct the redirect URL based on the extracted role slug. 
        // The convertToRoleData function is used to ensure that the role data is in the correct format (string) for constructing the URL.
    const redirectUrl = "/" + convertToRoleData(urlSlug, "string") + "/login";

    if (redirectUrl && location.pathname !== redirectUrl) {
      navigate(redirectUrl, { replace: true });
    }
  }, [location, navigate]);
};
