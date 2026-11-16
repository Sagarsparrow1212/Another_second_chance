import { Routes, Route } from "react-router-dom";
import { Sidenav, AppNavbar } from "@/widgets/layout";
import { getRoutes } from "@/routes";
import { useAuth } from "@/context/AuthContext";

export function Dashboard() {
  const { isAuthenticated } = useAuth();
  const routes = getRoutes(isAuthenticated);

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex overflow-x-hidden w-full">
      {/* Enterprise Sidebar */}
      <Sidenav routes={routes} />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 w-full xl:ml-64 flex flex-col min-h-screen transition-all duration-200">
        <AppNavbar brandName="Another Second Chance" />
        
        {/* Content Container */}
        <main className="flex-1 min-w-0 w-full px-4 sm:px-6 lg:px-8 pt-20 pb-12 max-w-[1440px] mx-auto">
          <Routes>
            {routes.map(
              ({ layout, pages }) =>
                layout === "dashboard" &&
                pages.map(({ path, element }) => (
                  <Route key={path} exact path={path} element={element} />
                ))
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
