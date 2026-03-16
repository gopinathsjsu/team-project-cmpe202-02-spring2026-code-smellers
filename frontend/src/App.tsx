import { Route, Routes } from "react-router";
import { Footer } from "./components/footer";
import { Navbar } from "./components/navbar";
import DashboardAdmin from "./pages/DashboardAdmin.tsx";
import DashboardOrganizer from "./pages/DashboardOrganizer.tsx";
import DashboardUser from "./pages/DashboardUser.tsx";
import ComponentDemo from "./pages/ComponentDemo.tsx";
import EventDetails from "./pages/EventDetails.tsx";
import Home from "./pages/Home.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import Forgot from "./pages/Forgot.tsx";

import { useLocation } from "react-router";

export default function App() {
  const location = useLocation();
  const hideHeaderFooter = ['/register', '/login', '/forgot'].includes(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-surface-base text-neutral-900">
      {!hideHeaderFooter && <Navbar isLoggedIn={false} onSearch={(query: string) => console.log(query)} />}
      <main className="flex-1">
        <Routes>
          <Route index element={<Home />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot" element={<Forgot />} />
          <Route path="dashboard-user" element={<DashboardUser />} />
          <Route path="dashboard-organizer" element={<DashboardOrganizer />} />
          <Route path="dashboard-admin" element={<DashboardAdmin />} />
          <Route path="ui-demo" element={<ComponentDemo />} />
          <Route path="events/:id" element={<EventDetails />} />
        </Routes>
      </main>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}
