import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Public / Attendee pages
import EventListPage from './pages/events/EventListPage';
import EventDetailPage from './pages/events/EventDetailPage';
import MyTicketsPage from './pages/tickets/MyTicketsPage';
import BookingPage from './pages/tickets/BookingPage';

// Organizer pages — reused order slot as EventForm
import EventFormPage from './pages/orders/OrderListPage'; // Tạo/Sửa sự kiện
import MyEventsPage from './pages/admin/EventManagePage'; // My Events (organizer)

// Admin pages
import DashboardPage from './pages/admin/DashboardPage';
import UserManagePage from './pages/admin/UserManagePage';

// Profile pages
import ProfilePage from './pages/profile/ProfilePage';
import SavedEventsPage from './pages/profile/SavedEventsPage';

// ---- Guards ----
const PrivateRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  return user ? children : <Navigate to="/login" replace />;
};

const OrganizerRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ORGANIZER' && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const user = useAuthStore((s) => s.user);
  return !user ? children : <Navigate to="/" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Public Event Pages */}
        <Route path="/" element={<EventListPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />

        {/* Attendee-only */}
        <Route path="/my-registrations" element={<PrivateRoute><MyTicketsPage /></PrivateRoute>} />
        <Route path="/my-tickets" element={<PrivateRoute><MyTicketsPage /></PrivateRoute>} />
        <Route path="/events/:id/book" element={<PrivateRoute><BookingPage /></PrivateRoute>} />

        {/* Organizer + Admin */}
        <Route path="/organizer/my-events" element={<OrganizerRoute><MyEventsPage /></OrganizerRoute>} />
        <Route path="/organizer/events/create" element={<OrganizerRoute><EventFormPage /></OrganizerRoute>} />
        <Route path="/organizer/events/:id/edit" element={<OrganizerRoute><EventFormPage /></OrganizerRoute>} />

        {/* Admin only */}
        <Route path="/admin" element={<AdminRoute><DashboardPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UserManagePage /></AdminRoute>} />

        {/* Profile */}
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/profile/saved" element={<PrivateRoute><SavedEventsPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
