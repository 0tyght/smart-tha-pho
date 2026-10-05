import { lazy, Suspense, useEffect, useMemo } from "react";
import WasteLayout from "./components/WasteLayout.jsx";
import { useHashPage } from "./lib/useHashPage.js";
import "./waste.css";
import "./route-assignment.css";

const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const PlansPage = lazy(() => import("./pages/PlansPage.jsx"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage.jsx"));
const TrackingPage = lazy(() => import("./pages/TrackingPage.jsx"));
const ServiceUsersPage = lazy(() => import("./pages/ServiceUsersPage.jsx"));
const BillingPage = lazy(() => import("./pages/BillingPage.jsx"));
const IncidentsPage = lazy(() => import("./pages/IncidentsPage.jsx"));
const ReportsPage = lazy(() => import("./pages/ReportsPage.jsx"));
const DriverTrackingPage = lazy(() => import("./pages/DriverTrackingPage.jsx"));
const LineSettingsPage = lazy(() => import("./pages/LineSettingsPage.jsx"));

const PAGES = Object.freeze({
  dashboard: DashboardPage,
  plans: PlansPage,
  resources: ResourcesPage,
  tracking: TrackingPage,
  "service-users": ServiceUsersPage,
  billing: BillingPage,
  incidents: IncidentsPage,
  reports: ReportsPage,
  "line-settings": LineSettingsPage,
});

export const WASTE_PAGE_IDS = Object.freeze(Object.keys(PAGES));

function PageLoading() {
  return <main className="waste-auth-check" aria-live="polite" aria-busy="true">กำลังเปิดข้อมูลระบบจัดการเก็บขยะ</main>;
}

export default function WasteManagementApp({ applicationController }) {
  if (!applicationController) {
    throw new TypeError("WasteManagementApp requires applicationController");
  }
  const { page: requestedPage, query, navigate } = useHashPage();
  const isDriverTracking = requestedPage === "driver-gps";
  const viewModel = useMemo(() => applicationController.createViewModel(requestedPage), [requestedPage]);
  const { token, user, page } = viewModel;
  const permittedPage = page === "line-settings" && user?.role !== "ADMIN" ? "dashboard" : page;
  const Page = PAGES[permittedPage] || DashboardPage;

  useEffect(() => { if (!isDriverTracking && !token) applicationController.redirectToLogin(); }, [isDriverTracking, token]);
  useEffect(() => {
    return applicationController.subscribeToExpiration(() => applicationController.logout());
  }, []);
  useEffect(() => { if (!isDriverTracking && requestedPage !== permittedPage) navigate(permittedPage); }, [isDriverTracking, navigate, permittedPage, requestedPage]);
  if (isDriverTracking) return <Suspense fallback={<PageLoading />}><DriverTrackingPage trackingToken={query.get("token") || ""} /></Suspense>;
  if (!token) return <main className="waste-auth-check">กำลังตรวจสอบสิทธิ์เข้าใช้งาน</main>;

  return <WasteLayout page={page} navigate={navigate} user={user} onSwitchSystem={() => applicationController.switchSystem()} onLogout={() => applicationController.logout()}><Suspense fallback={<PageLoading />}><Page token={token} navigate={navigate} planId={query.get("plan")} /></Suspense></WasteLayout>;
}
