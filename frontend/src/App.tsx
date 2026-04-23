import { useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import { Footer } from "./components/footer";
import { Navbar } from "./components/navbar";
import DashboardAdmin from "./pages/DashboardAdmin.tsx";
import DashboardOrganizer from "./pages/DashboardOrganizer.tsx";
import DashboardUser from "./pages/DashboardUser.tsx";
import ComponentDemo from "./pages/ComponentDemo.tsx";
import CreateEvent from "./pages/CreateEvent.tsx";
import EventDetails from "./pages/EventDetails.tsx";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Forgot from "./pages/Forgot.tsx";
import SearchEvents from "./pages/SearchEvents.tsx";
import UserSettings from "./pages/UserSettings.tsx";
import { GuestOnlyRoute } from "./routes/GuestOnlyRoute.tsx";
import { ProtectedRoute } from "./routes/ProtectedRoute.tsx";

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [browseLocation, setBrowseLocation] = useState("San Jose");
  const hideHeaderFooter = ["/register", "/login", "/forgot"].includes(
    pathname,
  );

  function handleNavbarSearch(params: { query: string; location: string }) {
    const searchParams = new URLSearchParams();
    const q = params.query.trim();
    const loc = params.location.trim();
    if (q) searchParams.set("q", q);
    if (loc) searchParams.set("loc", loc);
    const search = searchParams.toString();
    navigate({ pathname: "/search", search: search ? `?${search}` : "" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-neutral-900">
      {!hideHeaderFooter && (
        <Navbar
          browseLocation={browseLocation}
          onBrowseLocationChange={setBrowseLocation}
          onSearch={handleNavbarSearch}
        />
      )}
      <main className="flex-1">
        <Routes>
          <Route index element={<Home browseLocation={browseLocation} />} />
          <Route element={<GuestOnlyRoute />}>
            <Route path="register" element={<Register />} />
            <Route path="login" element={<Login />} />
          </Route>
          <Route path="forgot" element={<Forgot />} />
          {/* Role-based checks (attendee vs organizer vs admin) can be added later; this only requires login */}
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard-user" element={<DashboardUser />} />
            <Route path="dashboard-organizer" element={<DashboardOrganizer />} />
            <Route path="dashboard-admin" element={<DashboardAdmin />} />
            <Route path="CreateEvent" element={<CreateEvent />} />
            <Route path="settings" element={<UserSettings />} />
          </Route>
          <Route path="ui-demo" element={<ComponentDemo />} />
          <Route path="events/:id" element={<EventDetails />} />
          <Route path="search" element={<SearchEvents />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}
