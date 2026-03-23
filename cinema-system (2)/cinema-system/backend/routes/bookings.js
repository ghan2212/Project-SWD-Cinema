const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
 
// GET /api/bookings
// admin/manager/ticket_staff: xem tất cả, có thể filter
// customer: chỉ xem của mình
router.get('/', auth, async (req, res) => {
  try {
    let query = `SELECT b.*, u.full_name, u.email, u.phone,
                 s.show_date, s.start_time, m.title as movie_title, m.poster_url,
                 r.name as room_name
                 FROM bookings b
                 JOIN users u ON b.user_id = u.id
                 JOIN showtimes s ON b.showtime_id = s.id
                 JOIN movies m ON s.movie_id = m.id
                 JOIN cinema_rooms r ON s.room_id = r.id
                 WHERE 1=1`;
    const params = [];
 
    if (req.user.role_name === 'customer') {
      query += ' AND b.user_id = ?';
      params.push(req.user.id);
    }
 
    if (req.query.status) { query += ' AND b.status = ?'; params.push(req.query.status); }
    if (req.query.show_date) { query += ' AND s.show_date = ?'; params.push(req.query.show_date); }
    if (req.query.user_id && req.user.role_name !== 'customer') {
      query += ' AND b.user_id = ?'; params.push(req.query.user_id);
    }
 
    query += ' ORDER BY b.booking_time DESC';
 
    // Phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    query += ` LIMIT ${limit} OFFSET ${offset}`;
 
    const [bookings] = await db.query(query, params);
 
    for (let b of bookings) {
      const [details] = await db.query(
        `SELECT bd.*, s.seat_number, s.seat_type
         FROM booking_details bd JOIN seats s ON bd.seat_id = s.id
         WHERE bd.booking_id = ?`,
        [b.id]
      );
      b.seats = details;
    }
 
    res.json({ success: true, data: bookings, page, limit });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/bookings/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, u.full_name, u.email, u.phone,
       s.show_date, s.start_time, s.end_time, s.price_standard, s.price_vip, s.price_couple,
       m.title as movie_title, m.poster_url, m.duration, m.age_rating, m.language,
       r.name as room_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE b.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });
 
    if (req.user.role_name === 'customer' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
 
    const [details] = await db.query(
      `SELECT bd.*, se.seat_number, se.seat_type
       FROM booking_details bd JOIN seats se ON bd.seat_id = se.id
       WHERE bd.booking_id = ?`,
      [req.params.id]
    );
    const [ticket] = await db.query('SELECT * FROM tickets WHERE booking_id = ?', [req.params.id]);
    const [payment] = await db.query('SELECT * FROM payments WHERE booking_id = ?', [req.params.id]);
 
    rows[0].seats = details;
    rows[0].ticket = ticket[0] || null;
    rows[0].payment = payment[0] || null;
 
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// POST /api/bookings - Customer đặt vé, giữ ghế 5 phút
router.post('/', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { showtime_id, seat_ids } = req.body;
 
    if (!seat_ids || seat_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Chưa chọn ghế' });
    }
 
    const [showtimes] = await conn.query(
      'SELECT * FROM showtimes WHERE id = ? AND status = "active"', [showtime_id]
    );
    if (!showtimes.length) {
      return res.status(400).json({ success: false, message: 'Suất chiếu không có sẵn' });
    }
    const showtime = showtimes[0];
 
    const placeholders = seat_ids.map(() => '?').join(',');
 
    const [bookedSeats] = await conn.query(
      `SELECT bd.seat_id FROM booking_details bd
       JOIN bookings b ON bd.booking_id = b.id
       WHERE b.showtime_id = ? AND bd.seat_id IN (${placeholders})
       AND (b.status = 'paid' OR (b.status = 'pending' AND b.expires_at > NOW()))`,
      [showtime_id, ...seat_ids]
    );
    if (bookedSeats.length > 0) {
      return res.status(400).json({ success: false, message: 'Một số ghế đã được đặt' });
    }
 
    const [seats] = await conn.query(
      `SELECT s.* FROM seats s
       JOIN cinema_rooms r ON s.room_id = r.id
       JOIN showtimes st ON st.room_id = r.id
       WHERE st.id = ? AND s.id IN (${placeholders})`,
      [showtime_id, ...seat_ids]
    );
 
    let total = 0;
    for (const seat of seats) {
      if (seat.seat_type === 'vip') total += parseFloat(showtime.price_vip);
      else if (seat.seat_type === 'couple') total += parseFloat(showtime.price_couple);
      else total += parseFloat(showtime.price_standard);
    }
 
    const [booking] = await conn.query(
      `INSERT INTO bookings (user_id, showtime_id, total_amount, status, expires_at)
       VALUES (?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
      [req.user.id, showtime_id, total]
    );
    const bookingId = booking.insertId;
 
    for (const seat of seats) {
      const price = seat.seat_type === 'vip' ? showtime.price_vip
        : seat.seat_type === 'couple' ? showtime.price_couple
        : showtime.price_standard;
      await conn.query(
        'INSERT INTO booking_details (booking_id, seat_id, price) VALUES (?, ?, ?)',
        [bookingId, seat.id, price]
      );
    }
 
    await conn.commit();
    res.status(201).json({ success: true, booking_id: bookingId, total_amount: total });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});
 
// PUT /api/bookings/:id/cancel - Customer hủy của mình; Staff/Admin hủy bất kỳ
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });
 
    if (req.user.role_name === 'customer' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (rows[0].status === 'paid' && req.user.role_name === 'customer') {
      return res.status(400).json({ success: false, message: 'Không thể hủy booking đã thanh toán' });
    }
 
    await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Booking đã được hủy' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// PUT /api/bookings/:id/confirm - Staff/Admin xác nhận booking
router.put('/:id/confirm', auth, requireRole('admin', 'manager', 'ticket_staff'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (!['paid', 'pending'].includes(rows[0].status)) {
      return res.status(400).json({ success: false, message: `Không thể confirm booking có trạng thái: ${rows[0].status}` });
    }
    await db.query('UPDATE bookings SET status = "confirmed" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Booking đã được xác nhận' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;