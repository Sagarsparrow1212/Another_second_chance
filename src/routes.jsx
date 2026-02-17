// Modern professional icons from Lucide React
import {
  LayoutDashboard,
  Building2,
  Store,
  HeartHandshake,
  Users,
  Briefcase,
  LogOut,
  LogIn,
  BarChart3,
} from "lucide-react";
import { 
  Home, 
  Profile, 
  Tables,   
  Notifications,
  Organizations,
  AddOrganization,
  OrganizationDetails,
  EditOrganization,
  Merchants,
  RegisterMerchant,
  MerchantDetails,
  EditMerchant,
  Donors,
  RegisterDonor,
  DonorDetails,
  EditDonor,
  Homeless,
  RegisterHomeless,
  HomelessDetails,
  EditHomeless,
  JobsList,
  JobDetails,
} from "@/pages/dashboard";

import { SignIn, SignUp } from "@/pages/auth";

const icon = {
  className: "w-5 h-5 text-inherit",
  strokeWidth: 2,
};

// Function to get routes based on authentication state
export const getRoutes = (isAuthenticated) => {
  const baseRoutes = [
    {
      layout: "dashboard",
      pages: [
        {
          icon: <LayoutDashboard {...icon} />,
          name: "dashboard",
          path: "/home",
          element: <Home />,
        },
      ],
    },
    {
      title: "Users",
      titleIcon: <Users {...icon} />,
      layout: "dashboard",
      pages: [
        {
          icon: <Building2 {...icon} />,
          name: "Organizations",
          path: "/organizations",
          element: <Organizations />,
        },
        {
          name: "Add Organization",
          path: "/organizations/add",
          element: <AddOrganization />,
          hidden: true, // Hide from sidebar, only accessible via button
        },
        {
          name: "Organization Details",
          path: "/organizations/:id",
          element: <OrganizationDetails />,
          hidden: true, // Hide from sidebar, only accessible via View button
        },
        {
          name: "Edit Organization",
          path: "/organizations/:id/edit",
          element: <EditOrganization />,
          hidden: true, // Hide from sidebar, only accessible via Edit button
        },
        {
          icon: <Store {...icon} />,
          name: "Merchants",
          path: "/merchants",
          element: <Merchants />, 
        },
        {
          name: "Register Merchant",
          path: "/merchants/register",
          element: <RegisterMerchant />,
          hidden: true, // Hide from sidebar, only accessible via button
        },
        {
          name: "Merchant Details",
          path: "/merchants/:id",
          element: <MerchantDetails />,
          hidden: true, // Hide from sidebar, only accessible via View button
        },
        {
          name: "Edit Merchant",
          path: "/merchants/:id/edit",
          element: <EditMerchant />,
          hidden: true, // Hide from sidebar, only accessible via Edit button
        },
        {
          icon: <HeartHandshake {...icon} />,
          name: "Donors",
          path: "/donors",
          element: <Donors />,
        },
        {
          name: "Donor Details",
          path: "/donors/:id",
          element: <DonorDetails />,
          hidden: true, // Hide from sidebar, only accessible via View button
        },
        {
          name: "Edit Donor",
          path: "/donors/:id/edit",
          element: <EditDonor />,
          hidden: true, // Hide from sidebar, only accessible via Edit button
        },
        {
          name: "Register Donor",
          path: "/donors/register",
          element: <RegisterDonor />,
          hidden: true, // Hide from sidebar, only accessible via button
        },
        {
          icon: <Users {...icon} />,
          name: "Homeless",
          path: "/homeless",
          element: <Homeless />,
        },
        {
          name: "Homeless Details",
          path: "/homeless/:id",
          element: <HomelessDetails />,
          hidden: true, // Hide from sidebar, only accessible via View button
        },
        {
          name: "Edit Homeless",
          path: "/homeless/:id/edit",
          element: <EditHomeless />,
          hidden: true, // Hide from sidebar, only accessible via Edit button
        },
        {
          name: "Register Homeless",
          path: "/homeless/register",
          element: <RegisterHomeless />,
          hidden: true, // Hide from sidebar, only accessible via button
        },
        {
          name: "Register Homeless for Organization",
          path: "/homeless/register/:organizationId",
          element: <RegisterHomeless />,
          hidden: true, // Hide from sidebar, only accessible via Add Homeless button
        },
      ],
    },
    {
      layout: "dashboard",
      pages: [
        {
          icon: <Briefcase {...icon} />,
          name: "Jobs",
          path: "/jobs",
          element: <JobsList />,
        },
        {
          name: "Job Details",
          path: "/jobs/:id",
          element: <JobDetails />,
          hidden: true, // Hide from sidebar, only accessible via View button
        },
      ],
    },  
     
  ];

  // Add auth route based on authentication state
  if (isAuthenticated) {
    baseRoutes.push({
      layout: "auth",
      pages: [
        {
          icon: <LogOut {...icon} />,
          name: "logout",
          path: "/logout",
          element: null, // This will be handled by sidenav
          isLogout: true,
        },
      ],
    });
  } else {
    baseRoutes.push({
      layout: "auth",
      pages: [
        {
          icon: <LogIn {...icon} />,
          name: "sign in",
          path: "/sign-in",
          element: <SignIn />,
        },
      ],
    });
  }

  return baseRoutes;
};

// Default routes for backward compatibility
export const routes = getRoutes(false);

export default routes;
