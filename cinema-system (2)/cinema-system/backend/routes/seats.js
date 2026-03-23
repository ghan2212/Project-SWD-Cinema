const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
 
// GET /api/seats/showtime/:showtime_id - Public: xem ghế + trạng thái đặt chỗ
router.get('/showtime/:showtime_id', async (req, res) => {
  try {
    const [showtime] = await db.query(
      'SELECT room_id FROM showtimes WHERE id = ?', [req.params.showtime_id]
    );
    if (!showtime.length) return res.status(404).json({ success: false, message: 'Showtime not found' });
 
    const [seats] = await db.query(
      'SELECT * FROM seats WHERE room_id = ? ORDER BY seat_number',
      [showtime[0].room_id]
    );
 
    const [bookedIds] = await db.query(
      `SELECT bd.seat_id FROM booking_details bd
       JOIN bookings b ON bd.booking_id = b.id
       WHERE b.showtime_id = ?
       AND (b.status = 'paid' OR b.status = 'confirmed'
            OR (b.status = 'pending' AND b.expires_at > NOW()))`,
      [req.params.showtime_id]
    );
    const bookedSet = new Set(bookedIds.map(r => r.seat_id));
 
    const seatsWithStatus = seats.map(s => ({ ...s, is_booked: bookedSet.has(s.id) }));
    res.json({ success: true, data: seatsWithStatus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/seats/room/:room_id - Admin/Manager/Ticket Staff xem ghế theo phòng
router.get('/room/:room_id', auth, requireRole('admin', 'manager', 'ticket_staff'), async (req, res) => {
  try {
    const [seats] = await db.query(
      'SELECT * FROM seats WHERE room_id = ? ORDER BY seat_number',
      [req.params.room_id]
    );
    const [stats] = await db.query(
      `SELECT seat_type, COUNT(*) as count FROM seats WHERE room_id = ? GROUP BY seat_type`,
      [req.params.room_id]
    );
    res.json({ success: true, data: seats, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// POST /api/seats/generate - Admin/Manager tạo sơ đồ ghế cho phòng
// Body: { room_id, rows, cols, vip_rows: ['C','D'], couple_rows: ['H'] }
router.post('/generate', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { room_id, rows, cols, vip_rows = [], couple_rows = [] } = req.body;
    if (!room_id || !rows || !cols) {
      return res.status(400).json({ success: false, message: 'Thiếu room_id, rows hoặc cols' });
    }
 
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const seatData = [];
 
    for (let r = 0; r < rows; r++) {
      const rowLetter = letters[r];
      for (let c = 1; c <= cols; c++) {
        const seat_number = `${rowLetter}${c}`;
        let seat_type = 'standard';
        if (couple_rows.includes(rowLetter)) seat_type = 'couple';
        else if (vip_rows.includes(rowLetter)) seat_type = 'vip';
        seatData.push([room_id, seat_number, seat_type]);
      }
    }
 
    await db.query('DELETE FROM seats WHERE room_id = ?', [room_id]);
    if (seatData.length) {
      await db.query('INSERT INTO seats (room_id, seat_number, seat_type) VALUES ?', [seatData]);
    }
    await db.query('UPDATE cinema_rooms SET total_seats = ? WHERE id = ?', [seatData.length, room_id]);
 
    res.json({ success: true, message: `Đã tạo ${seatData.length} ghế`, total: seatData.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;