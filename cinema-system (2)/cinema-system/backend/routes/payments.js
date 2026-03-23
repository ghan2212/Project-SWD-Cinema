const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
 
// POST /api/payments - Tạo thanh toán
// Customer tự thanh toán online; Staff/Manager/Admin thu tiền mặt hộ
router.post('/', auth, async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { booking_id, method = 'vnpay' } = req.body;
 
    const isStaff = ['admin', 'manager', 'ticket_staff'].includes(req.user.role_name);
 
    let bookingQuery = 'SELECT * FROM bookings WHERE id = ?';
    const bookingParams = [booking_id];
    if (!isStaff) {
      bookingQuery += ' AND user_id = ?';
      bookingParams.push(req.user.id);
    }
 
    const [bookings] = await conn.query(bookingQuery, bookingParams);
    if (!bookings.length) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (bookings[0].status === 'cancelled') return res.status(400).json({ success: false, message: 'Booking đã bị hủy' });
    if (bookings[0].status === 'paid') return res.status(400).json({ success: false, message: 'Booking đã được thanh toán' });
 
    // Kiểm tra hết hạn chỉ với customer
    if (!isStaff) {
      const [expiredCheck] = await conn.query(
        'SELECT id FROM bookings WHERE id = ? AND expires_at < NOW()', [booking_id]
      );
      if (expiredCheck.length > 0) {
        await conn.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [booking_id]);
        await conn.commit();
        return res.status(400).json({ success: false, message: 'Booking đã hết hạn' });
      }
    }
 
    const transaction_code = `TXN${Date.now()}${uuidv4().slice(0, 8).toUpperCase()}`;
 
    const [payment] = await conn.query(
      'INSERT INTO payments (booking_id, amount, method, status, transaction_code, paid_at) VALUES (?, ?, ?, "success", ?, NOW())',
      [booking_id, bookings[0].total_amount, method, transaction_code]
    );
 
    await conn.query('UPDATE bookings SET status = "paid" WHERE id = ?', [booking_id]);
 
    const qrData = JSON.stringify({ booking_id, transaction_code, amount: bookings[0].total_amount });
    const qrCode = await QRCode.toDataURL(qrData);
    await conn.query('INSERT INTO tickets (booking_id, qr_code, status) VALUES (?, ?, "valid")', [booking_id, qrCode]);
 
    await conn.commit();
    res.json({ success: true, message: 'Thanh toán thành công', transaction_code, payment_id: payment.insertId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
});
 
// GET /api/payments - Admin/Manager xem đầy đủ kèm thống kê; Ticket Staff chỉ xem list
router.get('/', auth, requireRole('admin', 'manager', 'ticket_staff'), async (req, res) => {
  try {
    const { date_from, date_to, method, status } = req.query;
    let query = `SELECT p.*, b.user_id, u.full_name, u.email,
       m.title as movie_title, s.show_date, s.start_time, r.name as room_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE 1=1`;
    const params = [];
    if (date_from) { query += ' AND DATE(p.paid_at) >= ?'; params.push(date_from); }
    if (date_to) { query += ' AND DATE(p.paid_at) <= ?'; params.push(date_to); }
    if (method) { query += ' AND p.method = ?'; params.push(method); }
    if (status) { query += ' AND p.status = ?'; params.push(status); }
    query += ' ORDER BY p.created_at DESC';
 
    const [payments] = await db.query(query, params);
 
    // Chỉ admin/manager thấy summary doanh thu
    let summary = null;
    if (['admin', 'manager'].includes(req.user.role_name)) {
      const [[stats]] = await db.query(
        `SELECT COUNT(*) as total_count,
         COALESCE(SUM(CASE WHEN status='success' THEN amount END), 0) as total_revenue,
         COALESCE(SUM(CASE WHEN status='success' AND DATE(paid_at)=CURDATE() THEN amount END), 0) as today_revenue
         FROM payments`
      );
      summary = stats;
    }
 
    res.json({ success: true, data: payments, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/payments/:id - Chi tiết giao dịch
router.get('/:id', auth, requireRole('admin', 'manager', 'ticket_staff'), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, b.user_id, u.full_name, u.email, u.phone,
       m.title as movie_title, s.show_date, s.start_time,
       r.name as room_name, b.total_amount, b.status as booking_status
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN users u ON b.user_id = u.id
       JOIN showtimes s ON b.showtime_id = s.id
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;