import { useRoutes } from "react-router-dom";
import ProtectedRoutes from "../../components/ProtectedRoutes";
import LoginPage from "../../pages/login/LoginPage";
import Dashboard from "../../components/admin/dashboard/Dashboard";
import PanelLayout from "../../layouts/PanelLayout";
import PageNotFound from "../../components/PageNotFound";
import HeaderLayout from "../../layouts/HeaderLayout";
import { ThemeProvider } from "@emotion/react";
import theme from "../../theme";
import { CssBaseline } from "@mui/material";
import "@fontsource/public-sans";

// The AdminRoutes component defines the routing structure for the admin section of the application.
// It uses the useRoutes hook from react-router-dom to define the routes and their corresponding components.
// The routes are wrapped in a ThemeProvider to apply the custom theme and CssBaseline for consistent styling across the application.
// The ProtectedRoutes component is used to ensure that only authenticated users can access the admin routes.         
const AdminRoutes = () => {
  const routes = useRoutes([
    {
      path: "*",
      element: (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ProtectedRoutes>
            {useRoutes([
              {
                path: "login",
                element: <HeaderLayout />,
                children: [{ index: true, element: <LoginPage /> }],
              },
              {
                path: "/",
                element: <PanelLayout />,
                children: [
                  { index: true, element: <Dashboard /> },
                  { path: "admin", element: <Dashboard /> },
                ],
              },
              { path: "*", element: <PageNotFound /> },
            ])}
          </ProtectedRoutes>
        </ThemeProvider>
      ),
    },
    { path: "*", element: <PageNotFound /> },
  ]);

  return routes;
};

export default AdminRoutes;
