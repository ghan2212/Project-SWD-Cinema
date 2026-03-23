const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
 
// GET /api/rooms - Public (cần để hiển thị phòng khi đặt vé)
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM cinema_rooms';
    const params = [];
    if (status) { query += ' WHERE status = ?'; params.push(status); }
    query += ' ORDER BY name';
    const [rooms] = await db.query(query, params);
    res.json({ success: true, data: rooms });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/rooms/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const [rooms] = await db.query('SELECT * FROM cinema_rooms WHERE id = ?', [req.params.id]);
    if (!rooms.length) return res.status(404).json({ success: false, message: 'Room not found' });
    // Kèm theo số ghế theo loại
    const [seatStats] = await db.query(
      `SELECT seat_type, COUNT(*) as count FROM seats WHERE room_id = ? GROUP BY seat_type`,
      [req.params.id]
    );
    rooms[0].seat_stats = seatStats;
    res.json({ success: true, data: rooms[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// POST /api/rooms - Admin/Manager tạo phòng mới
router.post('/', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, total_seats, status = 'active' } = req.body;
    if (!name || !total_seats) return res.status(400).json({ success: false, message: 'Thiếu tên hoặc số ghế' });
    const [r] = await db.query(
      'INSERT INTO cinema_rooms (name, total_seats, status) VALUES (?, ?, ?)',
      [name, total_seats, status]
    );
    res.status(201).json({ success: true, id: r.insertId, message: 'Phòng chiếu đã được tạo' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// PUT /api/rooms/:id - Admin/Manager cập nhật phòng
router.put('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { name, total_seats, status } = req.body;
    await db.query(
      'UPDATE cinema_rooms SET name = ?, total_seats = ?, status = ? WHERE id = ?',
      [name, total_seats, status, req.params.id]
    );
    res.json({ success: true, message: 'Phòng chiếu đã được cập nhật' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// DELETE /api/rooms/:id - Chỉ Admin (đưa vào maintenance, không xóa thật)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    // Kiểm tra còn suất chiếu đang active không
    const [active] = await db.query(
      `SELECT id FROM showtimes WHERE room_id = ? AND status = 'active' AND show_date >= CURDATE()`,
      [req.params.id]
    );
    if (active.length) {
      return res.status(400).json({
        success: false,
        message: `Phòng còn ${active.length} suất chiếu đang hoạt động, không thể vô hiệu hóa`
      });
    }
    await db.query('UPDATE cinema_rooms SET status = "maintenance" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Phòng đã chuyển sang trạng thái bảo trì' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;