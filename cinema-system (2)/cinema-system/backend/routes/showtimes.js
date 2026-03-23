const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
 
// GET /api/showtimes - Public: xem lịch chiếu
router.get('/', async (req, res) => {
  try {
    const { movie_id, room_id, show_date, status } = req.query;
 
    let query = `SELECT s.*, m.title as movie_title, m.duration, m.poster_url, m.age_rating, m.language,
                 r.name as room_name, r.total_seats
                 FROM showtimes s
                 JOIN movies m ON s.movie_id = m.id
                 JOIN cinema_rooms r ON s.room_id = r.id
                 WHERE 1=1`;
    const params = [];
 
    if (movie_id) { query += ' AND s.movie_id = ?'; params.push(movie_id); }
    if (room_id) { query += ' AND s.room_id = ?'; params.push(room_id); }
    if (show_date) { query += ' AND s.show_date = ?'; params.push(show_date); }
 
    // Mặc định chỉ lấy active, trừ khi chỉ định rõ status
    if (status) { query += ' AND s.status = ?'; params.push(status); }
    else { query += ' AND s.status = "active"'; }
 
    query += ' ORDER BY s.show_date ASC, s.start_time ASC';
 
    const [showtimes] = await db.query(query, params);
 
    // Đếm ghế còn trống cho mỗi suất chiếu
    for (let st of showtimes) {
      const [[{ booked }]] = await db.query(
        `SELECT COUNT(*) as booked FROM booking_details bd
         JOIN bookings b ON bd.booking_id = b.id
         WHERE b.showtime_id = ?
         AND (b.status = 'paid' OR b.status = 'confirmed'
              OR (b.status = 'pending' AND b.expires_at > NOW()))`,
        [st.id]
      );
      st.seats_booked = booked;
      st.seats_available = st.total_seats - booked;
    }
 
    res.json({ success: true, data: showtimes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/showtimes/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, m.title as movie_title, m.duration, m.poster_url,
       m.description, m.age_rating, m.language, m.director, m.cast_members,
       r.name as room_name, r.total_seats
       FROM showtimes s
       JOIN movies m ON s.movie_id = m.id
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Suất chiếu không tồn tại' });
 
    // Đếm ghế còn trống
    const [[{ booked }]] = await db.query(
      `SELECT COUNT(*) as booked FROM booking_details bd
       JOIN bookings b ON bd.booking_id = b.id
       WHERE b.showtime_id = ?
       AND (b.status = 'paid' OR b.status = 'confirmed'
            OR (b.status = 'pending' AND b.expires_at > NOW()))`,
      [req.params.id]
    );
    rows[0].seats_booked = booked;
    rows[0].seats_available = rows[0].total_seats - booked;
 
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// POST /api/showtimes - Admin/Manager tạo suất chiếu
router.post('/', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { movie_id, room_id, start_time, show_date, price_standard, price_vip, price_couple } = req.body;
 
    if (!movie_id || !room_id || !start_time || !show_date) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
 
    // Lấy thời lượng phim để tính end_time
    const [movies] = await db.query('SELECT duration FROM movies WHERE id = ?', [movie_id]);
    if (!movies.length) return res.status(404).json({ success: false, message: 'Phim không tồn tại' });
 
    const [h, m] = start_time.split(':').map(Number);
    const totalMin = h * 60 + m + movies[0].duration + 15; // +15 phút dọn dẹp
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    const end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;
 
    // Kiểm tra xung đột lịch trong cùng phòng
    const [conflicts] = await db.query(
      `SELECT id FROM showtimes
       WHERE room_id = ? AND show_date = ? AND status = 'active'
       AND (
         (start_time < ? AND end_time > ?) OR
         (start_time < ? AND end_time > ?) OR
         (start_time >= ? AND start_time < ?)
       )`,
      [room_id, show_date, end_time, start_time, end_time, start_time, start_time, end_time]
    );
    if (conflicts.length) {
      return res.status(400).json({ success: false, message: 'Khung giờ này bị trùng với suất chiếu khác trong phòng' });
    }
 
    const [result] = await db.query(
      `INSERT INTO showtimes
       (movie_id, room_id, start_time, end_time, show_date, price_standard, price_vip, price_couple)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movie_id, room_id, start_time, end_time, show_date,
        price_standard || 90000,
        price_vip || 120000,
        price_couple || 200000
      ]
    );
    res.status(201).json({ success: true, message: 'Tạo suất chiếu thành công', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// PUT /api/showtimes/:id - Admin/Manager cập nhật
router.put('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { movie_id, room_id, start_time, show_date, price_standard, price_vip, price_couple, status } = req.body;
 
    // Không cho sửa nếu đã có booking paid
    const [[{ paid_count }]] = await db.query(
      `SELECT COUNT(*) as paid_count FROM bookings WHERE showtime_id = ? AND status IN ('paid','confirmed')`,
      [req.params.id]
    );
    if (paid_count > 0 && (movie_id || room_id || start_time || show_date)) {
      return res.status(400).json({
        success: false,
        message: `Suất chiếu đã có ${paid_count} vé được đặt. Chỉ có thể cập nhật giá hoặc trạng thái.`
      });
    }
 
    await db.query(
      `UPDATE showtimes SET movie_id=?, room_id=?, start_time=?, show_date=?,
       price_standard=?, price_vip=?, price_couple=?, status=? WHERE id=?`,
      [movie_id, room_id, start_time, show_date, price_standard, price_vip, price_couple, status, req.params.id]
    );
    res.json({ success: true, message: 'Cập nhật suất chiếu thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// DELETE /api/showtimes/:id - Admin/Manager hủy suất chiếu
router.delete('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const [[{ paid_count }]] = await db.query(
      `SELECT COUNT(*) as paid_count FROM bookings WHERE showtime_id = ? AND status IN ('paid','confirmed')`,
      [req.params.id]
    );
    if (paid_count > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể hủy: suất chiếu đã có ${paid_count} vé được mua`
      });
    }
    await db.query('UPDATE showtimes SET status = "cancelled" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã hủy suất chiếu' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;