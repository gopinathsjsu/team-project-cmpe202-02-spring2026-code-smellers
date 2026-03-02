import { Route, Routes } from "react-router";
import Navbar from "./components/Navbar.tsx";
import Footer from "./components/Footer.tsx";
import Home from "./pages/Home.tsx";
import Register from "./pages/Register.tsx";
import Login from "./pages/Login.tsx";
import DashboardUser from "./pages/DashboardUser.tsx";
import DashboardOrganizer from "./pages/DashboardOrganizer.tsx";
import DashboardAdmin from "./pages/DashboardAdmin.tsx";
import EventDetails from "./pages/EventDetails.tsx";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route index element={<Home />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="dashboard-user" element={<DashboardUser />} />
          <Route path="dashboard-organizer" element={<DashboardOrganizer />} />
          <Route path="dashboard-admin" element={<DashboardAdmin />} />
          <Route path="events/:id" element={<EventDetails />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
