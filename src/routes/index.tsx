import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import RootLayout from "@/src/layouts/RootLayout";
import MainLayout from "@/src/layouts/MainLayout";
import AuthLayout from "@/src/layouts/AuthLayout";
import AdminLayout from "@/src/layouts/AdminLayout";
import MapsLayout from "@/src/layouts/MapsLayout";
import ProfileLayout from "@/src/layouts/ProfileLayout";
import NotFound from "@/src/pages/NotFound";
import PageSuspense from "@/components/client/shared/PageSuspense";

function lazyPage(
  factory: () => Promise<{ default: ComponentType<Record<string, never>> }>,
  pageName: string,
) {
  const Page = lazy(factory) as LazyExoticComponent<ComponentType<Record<string, never>>>;
  return (
    <Suspense fallback={<PageSuspense pageName={pageName} />}>
      <Page />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: lazyPage(() => import("@/app/(pages)/(main)/(hompage)/page"), "home") },
          { path: "campaigns", element: lazyPage(() => import("@/app/(pages)/(main)/campaigns/(search)/page"), "campaigns") },
          { path: "campaigns/create", element: lazyPage(() => import("@/app/(pages)/(main)/campaigns/create/page"), "campaigns-create") },
          { path: "campaigns/me", element: lazyPage(() => import("@/app/(pages)/(main)/campaigns/me/page"), "campaigns-me") },
          { path: "campaigns/:id", element: lazyPage(() => import("@/app/(pages)/(main)/campaigns/[id]/page"), "campaign-detail") },
          { path: "incidents", element: lazyPage(() => import("@/app/(pages)/(main)/incidents/(search)/page"), "incidents") },
          { path: "incidents/create", element: lazyPage(() => import("@/app/(pages)/(main)/incidents/create/page"), "incidents-create") },
          { path: "incidents/me", element: lazyPage(() => import("@/app/(pages)/(main)/incidents/me/page"), "incidents-me") },
          { path: "incidents/:id", element: lazyPage(() => import("@/app/(pages)/(main)/incidents/[id]/page"), "incident-detail") },
          { path: "organizations", element: lazyPage(() => import("@/app/(pages)/(main)/organizations/(search)/page"), "organizations") },
          { path: "organizations/create", element: lazyPage(() => import("@/app/(pages)/(main)/organizations/create/page"), "organizations-create") },
          { path: "organizations/me", element: lazyPage(() => import("@/app/(pages)/(main)/organizations/me/page"), "organizations-me") },
          { path: "organizations/:slug", element: lazyPage(() => import("@/app/(pages)/(main)/organizations/[id]/page"), "organization-detail") },
          { path: "gifts", element: lazyPage(() => import("@/app/(pages)/(main)/gifts/page"), "gifts") },
          {
            path: "profile",
            element: <ProfileLayout />,
            children: [
              { index: true, element: <Navigate to="/profile/account" replace /> },
              { path: "account", element: lazyPage(() => import("@/app/(pages)/(main)/profile/account/page"), "profile-account") },
              { path: "notification-settings", element: lazyPage(() => import("@/app/(pages)/(main)/profile/notification-settings/page"), "profile-notification-settings") },
              { path: "points", element: lazyPage(() => import("@/app/(pages)/(main)/profile/points/page"), "profile-points") },
              { path: "orders", element: lazyPage(() => import("@/app/(pages)/(main)/profile/orders/page"), "profile-orders") },
            ],
          },
          { path: "*", element: <NotFound /> },
        ],
      },
      {
        element: <MapsLayout />,
        children: [
          { path: "maps", element: lazyPage(() => import("@/app/(pages)/(maps)/maps/page"), "maps") },
        ],
      },
      {
        element: <AuthLayout />,
        children: [
          { path: "sign-in", element: lazyPage(() => import("@/app/(pages)/(auth)/sign-in/page"), "sign-in") },
          { path: "sign-up", element: lazyPage(() => import("@/app/(pages)/(auth)/sign-up/page"), "sign-up") },
          { path: "authenticate", element: lazyPage(() => import("@/app/(pages)/(auth)/authenticate/page"), "authenticate") },
          { path: "reset-password", element: lazyPage(() => import("@/app/(pages)/(auth)/reset-password/page"), "reset-password") },
          { path: "request-reset-password", element: lazyPage(() => import("@/app/(pages)/(auth)/request-reset-password/page"), "request-reset-password") },
          { path: "google-callback", element: lazyPage(() => import("@/app/(pages)/(auth)/google-callback/page"), "google-callback") },
          { path: "auth/oauth/google/callback", element: lazyPage(() => import("@/app/(pages)/(auth)/auth/oauth/google/callback/page"), "google-callback") },
        ],
      },
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: lazyPage(() => import("@/app/(pages)/(admin)/admin/page"), "admin") },
          { path: "campaigns", element: lazyPage(() => import("@/app/(pages)/(admin)/admin/campaigns/page"), "admin-campaigns") },
          { path: "incidents", element: lazyPage(() => import("@/app/(pages)/(admin)/admin/incidents/page"), "admin-incidents") },
          { path: "organizations", element: lazyPage(() => import("@/app/(pages)/(admin)/admin/organizations/page"), "admin-organizations") },
          { path: "users", element: lazyPage(() => import("@/app/(pages)/(admin)/admin/users/page"), "admin-users") },
          { path: "gifts", element: lazyPage(() => import("@/app/(pages)/(admin)/admin/gifts/page"), "admin-gifts") },
          { path: "settings", element: lazyPage(() => import("@/app/(pages)/(admin)/admin/settings/page"), "admin-settings") },
          { path: "*", element: <NotFound /> },
        ],
      },
    ],
  },
]);
