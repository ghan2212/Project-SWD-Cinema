const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
 
// GET /api/tickets/today - Ticket staff xem vé hôm nay cần xử lý
router.get('/today', auth, requireRole('admin', 'manager', 'ticket_staff'), async (req, res) => {
  try {
    const { status, room_id } = req.query;
    let query = `SELECT t.*, b.total_amount, b.status as booking_status, b.user_id,
       u.full_name, u.phone,
       s.show_date, s.start_time, m.title as movie_title,
       r.name as room_name, r.id as room_id,
       GROUP_CONCAT(se.seat_number ORDER BY se.seat_number) as seats
       FROM tickets t
       JOIN bookings b ON t.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       LEFT JOIN booking_details bd ON bd.booking_id = b.id
       LEFT JOIN seats se ON bd.seat_id = se.id
       WHERE DATE(s.show_date) = CURDATE()`;
    const params = [];
 
    if (status) { query += ' AND t.status = ?'; params.push(status); }
    if (room_id) { query += ' AND r.id = ?'; params.push(room_id); }
 
    query += ' GROUP BY t.id ORDER BY s.start_time ASC';
    const [tickets] = await db.query(query, params);
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/tickets/booking/:booking_id - Lấy vé theo booking
router.get('/booking/:booking_id', auth, async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT t.*, b.total_amount, b.status as booking_status, b.user_id,
       u.full_name, u.email, u.phone,
       s.show_date, s.start_time, m.title as movie_title,
       r.name as room_name,
       GROUP_CONCAT(se.seat_number ORDER BY se.seat_number) as seats
       FROM tickets t
       JOIN bookings b ON t.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       LEFT JOIN booking_details bd ON bd.booking_id = b.id
       LEFT JOIN seats se ON bd.seat_id = se.id
       WHERE t.booking_id = ?
       GROUP BY t.id`,
      [req.params.booking_id]
    );
    if (!tickets.length) return res.status(404).json({ success: false, message: 'Ticket not found' });
 
    // Customer chỉ xem vé của mình
    if (req.user.role_name === 'customer' && tickets[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
 
    res.json({ success: true, data: tickets[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/tickets/:id - Lấy vé theo ticket id
router.get('/:id', auth, async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT t.*, b.total_amount, b.status as booking_status, b.user_id,
       u.full_name, u.email, u.phone,
       s.show_date, s.start_time, m.title as movie_title,
       r.name as room_name,
       GROUP_CONCAT(se.seat_number ORDER BY se.seat_number) as seats
       FROM tickets t
       JOIN bookings b ON t.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       LEFT JOIN booking_details bd ON bd.booking_id = b.id
       LEFT JOIN seats se ON bd.seat_id = se.id
       WHERE t.id = ?
       GROUP BY t.id`,
      [req.params.id]
    );
    if (!tickets.length) return res.status(404).json({ success: false, message: 'Ticket not found' });
 
    if (req.user.role_name === 'customer' && tickets[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
 
    res.json({ success: true, data: tickets[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// PUT /api/tickets/verify/:id - Staff xác minh và đánh dấu vé đã dùng
router.put('/verify/:id', auth, requireRole('admin', 'manager', 'ticket_staff'), async (req, res) => {
  try {
    const [tickets] = await db.query(
      `SELECT t.*, b.user_id, u.full_name, m.title as movie_title, s.show_date, s.start_time
       FROM tickets t
       JOIN bookings b ON t.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (!tickets.length) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (tickets[0].status === 'used') return res.status(400).json({ success: false, message: 'Vé đã được sử dụng' });
    if (tickets[0].status === 'cancelled') return res.status(400).json({ success: false, message: 'Vé đã bị hủy' });
 
    await db.query('UPDATE tickets SET status = "used" WHERE id = ?', [req.params.id]);
 
    res.json({
      success: true,
      message: 'Vé hợp lệ - đã xác minh thành công',
      data: {
        customer: tickets[0].full_name,
        movie: tickets[0].movie_title,
        show_date: tickets[0].show_date,
        start_time: tickets[0].start_time
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;
 