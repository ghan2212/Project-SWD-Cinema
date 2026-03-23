const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
 
// GET /api/movies/categories/all - Phải đặt TRƯỚC /:id để không bị conflict
router.get('/categories/all', async (req, res) => {
  try {
    const [cats] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/movies - Public, có filter + phân trang
router.get('/', async (req, res) => {
  try {
    const { status, category_id, search, page = 1, limit = 12 } = req.query;
 
    let baseQuery = `SELECT m.*, c.name as category_name
                     FROM movies m LEFT JOIN categories c ON m.category_id = c.id
                     WHERE 1=1`;
    const params = [];
 
    if (status) { baseQuery += ' AND m.status = ?'; params.push(status); }
    if (category_id) { baseQuery += ' AND m.category_id = ?'; params.push(category_id); }
    if (search) { baseQuery += ' AND m.title LIKE ?'; params.push(`%${search}%`); }
 
    // Đếm tổng
    const countQuery = baseQuery.replace(
      'SELECT m.*, c.name as category_name',
      'SELECT COUNT(*) as total'
    );
    const [[{ total }]] = await db.query(countQuery, params);
 
    const offset = (parseInt(page) - 1) * parseInt(limit);
    baseQuery += ` ORDER BY m.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
 
    const [movies] = await db.query(baseQuery, params);
    res.json({
      success: true,
      data: movies,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/movies/:id - Public
router.get('/:id', async (req, res) => {
  try {
    const [movies] = await db.query(
      `SELECT m.*, c.name as category_name
       FROM movies m LEFT JOIN categories c ON m.category_id = c.id
       WHERE m.id = ?`,
      [req.params.id]
    );
    if (!movies.length) return res.status(404).json({ success: false, message: 'Phim không tồn tại' });
 
    // Lấy các suất chiếu sắp tới của phim
    const [showtimes] = await db.query(
      `SELECT s.id, s.show_date, s.start_time, s.end_time,
       s.price_standard, s.price_vip, s.price_couple, s.status,
       r.name as room_name, r.id as room_id
       FROM showtimes s
       JOIN cinema_rooms r ON s.room_id = r.id
       WHERE s.movie_id = ? AND s.status = 'active' AND s.show_date >= CURDATE()
       ORDER BY s.show_date ASC, s.start_time ASC`,
      [req.params.id]
    );
    movies[0].showtimes = showtimes;
 
    res.json({ success: true, data: movies[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// POST /api/movies - Admin/Manager thêm phim
router.post('/', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const {
      title, description, duration, release_date, status,
      category_id, poster_url, trailer_url, director,
      cast_members, language, age_rating
    } = req.body;
 
    if (!title || !duration) {
      return res.status(400).json({ success: false, message: 'Tên phim và thời lượng là bắt buộc' });
    }
 
    const [result] = await db.query(
      `INSERT INTO movies
       (title, description, duration, release_date, status, category_id,
        poster_url, trailer_url, director, cast_members, language, age_rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, description, duration, release_date,
        status || 'coming_soon', category_id,
        poster_url, trailer_url, director, cast_members,
        language || 'Vietnamese', age_rating || 'P'
      ]
    );
    res.status(201).json({ success: true, message: 'Thêm phim thành công', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// PUT /api/movies/:id - Admin/Manager cập nhật phim
router.put('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const {
      title, description, duration, release_date, status,
      category_id, poster_url, trailer_url, director,
      cast_members, language, age_rating
    } = req.body;
 
    const [existing] = await db.query('SELECT id FROM movies WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Phim không tồn tại' });
 
    await db.query(
      `UPDATE movies SET title=?, description=?, duration=?, release_date=?,
       status=?, category_id=?, poster_url=?, trailer_url=?,
       director=?, cast_members=?, language=?, age_rating=?
       WHERE id=?`,
      [
        title, description, duration, release_date, status, category_id,
        poster_url, trailer_url, director, cast_members,
        language, age_rating, req.params.id
      ]
    );
    res.json({ success: true, message: 'Cập nhật phim thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// DELETE /api/movies/:id - Chỉ Admin
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    // Kiểm tra còn suất chiếu active không
    const [active] = await db.query(
      `SELECT id FROM showtimes WHERE movie_id = ? AND status = 'active' AND show_date >= CURDATE()`,
      [req.params.id]
    );
    if (active.length) {
      return res.status(400).json({
        success: false,
        message: `Phim còn ${active.length} suất chiếu đang hoạt động, không thể xóa`
      });
    }
    await db.query('DELETE FROM movies WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Xóa phim thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;