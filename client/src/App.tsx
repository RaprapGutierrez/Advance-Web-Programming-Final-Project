import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./lib/auth";
import RequireRole from "./components/RequireRole";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Studios from "./pages/Studios";
import StudioDetails from "./pages/StudioDetails";
import Calendar from "./pages/Calendar";
import NewBooking from "./pages/NewBooking";
import EditBooking from "./pages/EditBooking";
import Renters from "./pages/Renters";
import Payments from "./pages/Payments";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Customer + Owner */}
              <Route element={<RequireRole allow={["customer", "owner"]} />}>
                <Route path="/studios" element={<Studios />} />
                <Route path="/studios/:id" element={<StudioDetails />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/bookings/new" element={<NewBooking />} />
              </Route>

              {/* Owner only */}
              <Route element={<RequireRole allow={["owner"]} />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/renters" element={<Renters />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/bookings/:id/edit" element={<EditBooking />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
