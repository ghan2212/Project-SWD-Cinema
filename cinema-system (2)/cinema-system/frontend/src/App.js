import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
 
// Public Pages
import HomePage from './pages/public/HomePage';
import MoviesPage from './pages/public/MoviesPage';
import MovieDetailPage from './pages/public/MovieDetailPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
 
// Customer Pages
import SeatSelectionPage from './pages/customer/SeatSelectionPage';
import PaymentPage from './pages/customer/PaymentPage';
import BookingHistoryPage from './pages/customer/BookingHistoryPage';
import BookingDetailPage from './pages/customer/BookingDetailPage';
import ProfilePage from './pages/customer/ProfilePage';
 
// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminMovies from './pages/admin/Movies';
import AdminShowtimes from './pages/admin/Showtimes';
import AdminUsers from './pages/admin/Users';
import AdminRooms from './pages/admin/Rooms';
import AdminBookings from './pages/admin/Bookings';
import AdminPayments from './pages/admin/Payments';
import AdminTickets from './pages/admin/Tickets';  // ← trang kiểm vé cho ticket_staff
import TicketScanner from './pages/admin/TicketScanner'; // ← màn hình soát vé QR
 
import Layout from './components/shared/Layout';
import AdminLayout from './components/admin/AdminLayout';
 
/**
 * PrivateRoute: bảo vệ route theo role
 * - Chưa đăng nhập → /login
 * - Sai role → /  (hoặc /admin nếu là staff)
 */
const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
 
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }
 
  if (!user) return <Navigate to="/login" replace />;
 
  if (roles && !roles.includes(user.role_name)) {
    // Staff bị redirect sang /admin thay vì trang chủ
    const isStaff = ['admin', 'manager', 'ticket_staff'].includes(user.role_name);
    return <Navigate to={isStaff ? '/admin' : '/'} replace />;
  }
 
  return children;
};
 
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/movies" element={<Layout><MoviesPage /></Layout>} />
          <Route path="/movies/:id" element={<Layout><MovieDetailPage /></Layout>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
 
          {/* ── Customer (+ admin/manager có thể dùng) ── */}
          <Route path="/booking/:showtime_id" element={
            <PrivateRoute roles={['customer', 'admin', 'manager']}>
              <Layout><SeatSelectionPage /></Layout>
            </PrivateRoute>
          } />
          <Route path="/payment/:booking_id" element={
            <PrivateRoute roles={['customer', 'admin', 'manager']}>
              <Layout><PaymentPage /></Layout>
            </PrivateRoute>
          } />
          <Route path="/my-bookings" element={
            <PrivateRoute roles={['customer', 'admin', 'manager']}>
              <Layout><BookingHistoryPage /></Layout>
            </PrivateRoute>
          } />
          <Route path="/my-bookings/:id" element={
            <PrivateRoute roles={['customer', 'admin', 'manager']}>
              <Layout><BookingDetailPage /></Layout>
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Layout><ProfilePage /></Layout>
            </PrivateRoute>
          } />
 
          {/* ── Admin / Manager / Ticket Staff ── */}
          <Route
            path="/admin"
            element={
              <PrivateRoute roles={['admin', 'manager', 'ticket_staff']}>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            {/* Dashboard — tất cả staff xem được, nội dung khác nhau theo role (xử lý ở backend) */}
            <Route index element={<AdminDashboard />} />
 
            {/* Admin + Manager */}
            <Route path="movies" element={
              <PrivateRoute roles={['admin', 'manager']}><AdminMovies /></PrivateRoute>
            } />
            <Route path="showtimes" element={
              <PrivateRoute roles={['admin', 'manager']}><AdminShowtimes /></PrivateRoute>
            } />
            <Route path="rooms" element={
              <PrivateRoute roles={['admin', 'manager']}><AdminRooms /></PrivateRoute>
            } />
 
            {/* Admin + Manager + Ticket Staff */}
            <Route path="bookings" element={
              <PrivateRoute roles={['admin', 'manager', 'ticket_staff']}><AdminBookings /></PrivateRoute>
            } />
            <Route path="tickets" element={
              <PrivateRoute roles={['admin', 'manager', 'ticket_staff']}><AdminTickets /></PrivateRoute>
            } />
            <Route path="ticket-scanner" element={
              <PrivateRoute roles={['admin', 'manager', 'ticket_staff']}><TicketScanner /></PrivateRoute>
            } />
            <Route path="payments" element={
              <PrivateRoute roles={['admin', 'manager', 'ticket_staff']}><AdminPayments /></PrivateRoute>
            } />
 
            {/* Chỉ Admin */}
            <Route path="users" element={
              <PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>
            } />
          </Route>
 
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
 
        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="dark"
          hideProgressBar={false}
        />
      </Router>
    </AuthProvider>
  );
}
 
export default App;