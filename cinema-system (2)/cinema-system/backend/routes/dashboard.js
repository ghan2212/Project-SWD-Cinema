const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
 
// GET /api/dashboard/stats - Dashboard tổng quan
// admin/manager: đầy đủ thống kê doanh thu + phim + booking
// ticket_staff: chỉ xem booking hôm nay + danh sách vé cần xử lý
router.get('/stats', auth, requireRole('admin', 'manager', 'ticket_staff'), async (req, res) => {
  try {
    const isStaff = req.user.role_name === 'ticket_staff';
 
    // --- Dữ liệu chung cho mọi role ---
    const [[{ today_bookings }]] = await db.query(
      `SELECT COUNT(*) as today_bookings FROM bookings WHERE DATE(booking_time) = CURDATE()`
    );
    const [[{ pending_bookings }]] = await db.query(
      `SELECT COUNT(*) as pending_bookings FROM bookings WHERE status = 'pending' AND expires_at > NOW()`
    );
 
    // Bookings hôm nay cần verify vé
    const [today_showings] = await db.query(
      `SELECT b.id, u.full_name, u.phone, m.title as movie_title,
       s.show_date, s.start_time, r.name as room_name,
       b.total_amount, b.status,
       GROUP_CONCAT(se.seat_number ORDER BY se.seat_number) as seats
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       LEFT JOIN booking_details bd ON bd.booking_id = b.id
       LEFT JOIN seats se ON bd.seat_id = se.id
       WHERE DATE(s.show_date) = CURDATE() AND b.status = 'paid'
       GROUP BY b.id
       ORDER BY s.start_time ASC
       LIMIT 20`
    );
 
    // Nếu là ticket_staff, trả về dữ liệu giới hạn
    if (isStaff) {
      const [[{ total_verified_today }]] = await db.query(
        `SELECT COUNT(*) as total_verified_today FROM tickets t
         JOIN bookings b ON t.booking_id = b.id
         JOIN showtimes s ON b.showtime_id = s.id
         WHERE t.status = 'used' AND DATE(s.show_date) = CURDATE()`
      );
 
      return res.json({
        success: true,
        role: 'ticket_staff',
        data: {
          today_bookings,
          pending_bookings,
          total_verified_today,
          today_showings
        }
      });
    }
 
    // --- Dữ liệu đầy đủ cho admin/manager ---
    const [[{ total_movies }]] = await db.query('SELECT COUNT(*) as total_movies FROM movies');
    const [[{ total_bookings }]] = await db.query('SELECT COUNT(*) as total_bookings FROM bookings');
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users WHERE role_id = 4');
    const [[{ total_revenue }]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments WHERE status = "success"`
    );
    const [[{ today_revenue }]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as today_revenue FROM payments WHERE status = "success" AND DATE(paid_at) = CURDATE()`
    );
 
    const [[{ now_showing }]] = await db.query(`SELECT COUNT(*) as now_showing FROM movies WHERE status = 'now_showing'`);
    const [[{ coming_soon }]] = await db.query(`SELECT COUNT(*) as coming_soon FROM movies WHERE status = 'coming_soon'`);
 
    // Doanh thu 7 ngày gần nhất
    const [revenue_chart] = await db.query(
      `SELECT DATE(paid_at) as date, SUM(amount) as revenue
       FROM payments WHERE status = "success" AND paid_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(paid_at) ORDER BY date`
    );
 
    // Top 5 phim theo lượt đặt
    const [top_movies] = await db.query(
      `SELECT m.id, m.title, m.poster_url, COUNT(b.id) as bookings,
       COALESCE(SUM(b.total_amount), 0) as revenue
       FROM movies m
       JOIN showtimes s ON s.movie_id = m.id
       JOIN bookings b ON b.showtime_id = s.id
       WHERE b.status IN ('paid', 'confirmed')
       GROUP BY m.id ORDER BY bookings DESC LIMIT 5`
    );
 
    // 10 booking gần nhất
    const [recent_bookings] = await db.query(
      `SELECT b.id, u.full_name, m.title as movie_title, b.total_amount, b.status, b.booking_time
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       ORDER BY b.booking_time DESC LIMIT 10`
    );
 
    // Doanh thu theo phương thức thanh toán
    const [revenue_by_method] = await db.query(
      `SELECT method, COUNT(*) as count, SUM(amount) as total
       FROM payments WHERE status = 'success'
       GROUP BY method`
    );
 
    res.json({
      success: true,
      role: req.user.role_name,
      data: {
        total_movies, total_bookings, total_users,
        total_revenue, today_revenue, today_bookings,
        pending_bookings, now_showing, coming_soon,
        revenue_chart, top_movies, recent_bookings,
        revenue_by_method, today_showings
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;