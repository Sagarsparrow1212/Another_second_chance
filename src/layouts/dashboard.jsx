import { Routes, Route } from "react-router-dom";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import {
  Sidenav,
  Configurator,
  Footer,
  AppNavbar,
} from "@/widgets/layout";
import { getRoutes } from "@/routes";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import { useAuth } from "@/context/AuthContext";

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType } = controller;
  const { isAuthenticated } = useAuth();
  const routes = getRoutes(isAuthenticated);

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
       <style>
        {`
          @media (min-width: 768px) {
            .responsive-padding {
              padding: 24px !important;
              padding-top: 96px !important;
            }
          }
        `}
      </style>
      <Sidenav
        routes={routes}
        brandImg={
          sidenavType === "dark" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"
        }
      />
      <AppNavbar brandName="Another Second Chance" isDashboard={true} />
      <div className="xl:ml-56 transition-all duration-300" style={{ padding: "16px", paddingTop: "80px", backgroundColor:"#FAFAFA" }}>
        <Configurator />
        {/* <IconButton
          size="lg"
          color="white"
          className="fixed bottom-8 right-8 z-40 rounded-full shadow-blue-gray-900/10"
          ripple={false}
          onClick={() => setOpenConfigurator(dispatch, true)}
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </IconButton> */}
        <Routes>
          {routes.map(
            ({ layout, pages }) =>
              layout === "dashboard" &&
              pages.map(({ path, element }) => {
                // Use relative path (remove leading slash) for nested Routes
                const routePath = path.startsWith('/') ? path.substring(1) : path;
                return (
                  <Route key={path} path={routePath} element={element} />
                );
              })
          )}
        </Routes>
        <div className="text-blue-gray-600">
          <Footer />
        </div>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layout/dashboard.jsx";

export default Dashboard;
