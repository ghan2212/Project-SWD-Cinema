const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
 
// GET /api/users - Admin xem tất cả; Manager xem được staff + customer
router.get('/', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { role_id, status, search } = req.query;
    let query = `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
                 r.name as role_name, r.id as role_id
                 FROM users u JOIN roles r ON u.role_id = r.id WHERE 1=1`;
    const params = [];
 
    // Manager không được xem admin khác
    if (req.user.role_name === 'manager') {
      query += ' AND u.role_id != 1';
    }
 
    if (role_id) { query += ' AND u.role_id = ?'; params.push(role_id); }
    if (status) { query += ' AND u.status = ?'; params.push(status); }
    if (search) { query += ' AND (u.full_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
 
    query += ' ORDER BY u.created_at DESC';
    const [users] = await db.query(query, params);
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/users/:id - Admin xem chi tiết user
router.get('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
       r.name as role_name, r.id as role_id
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [req.params.id]
    );
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });
 
    // Manager không được xem admin
    if (req.user.role_name === 'manager' && users[0].role_id === 1) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
 
    // Thống kê booking của user
    const [[{ total_bookings }]] = await db.query(
      `SELECT COUNT(*) as total_bookings FROM bookings WHERE user_id = ?`, [req.params.id]
    );
    const [[{ total_spent }]] = await db.query(
      `SELECT COALESCE(SUM(p.amount), 0) as total_spent FROM payments p
       JOIN bookings b ON p.booking_id = b.id WHERE b.user_id = ? AND p.status = 'success'`,
      [req.params.id]
    );
 
    users[0].stats = { total_bookings, total_spent };
    res.json({ success: true, data: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// POST /api/users - Chỉ Admin tạo user (staff, manager...)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { full_name, email, phone, password, role_id } = req.body;
    if (!full_name || !email || !password || !role_id) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
 
    const hashed = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO users (full_name, email, phone, password, role_id) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, phone, hashed, role_id]
    );
    res.status(201).json({ success: true, id: r.insertId, message: 'Tạo tài khoản thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// PUT /api/users/:id - Admin cập nhật mọi user; Manager chỉ cập nhật staff/customer
router.put('/:id', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { full_name, phone, status, role_id } = req.body;
 
    // Kiểm tra user tồn tại
    const [target] = await db.query('SELECT role_id FROM users WHERE id = ?', [req.params.id]);
    if (!target.length) return res.status(404).json({ success: false, message: 'User not found' });
 
    // Manager không được sửa admin
    if (req.user.role_name === 'manager' && target[0].role_id === 1) {
      return res.status(403).json({ success: false, message: 'Không có quyền chỉnh sửa admin' });
    }
    // Manager không được set role_id thành admin
    if (req.user.role_name === 'manager' && role_id === 1) {
      return res.status(403).json({ success: false, message: 'Không thể cấp quyền admin' });
    }
 
    await db.query(
      'UPDATE users SET full_name = ?, phone = ?, status = ?, role_id = ? WHERE id = ?',
      [full_name, phone, status, role_id, req.params.id]
    );
    res.json({ success: true, message: 'Cập nhật tài khoản thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// DELETE /api/users/:id - Chỉ Admin (ban user, không xóa thật)
router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Không thể ban chính mình' });
    }
    await db.query('UPDATE users SET status = "banned" WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Tài khoản đã bị khóa' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/users/roles/all - Lấy danh sách roles (để hiển thị trong form)
router.get('/roles/all', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const [roles] = await db.query('SELECT * FROM roles ORDER BY id');
    // Manager chỉ thấy role từ manager trở xuống
    const filtered = req.user.role_name === 'manager'
      ? roles.filter(r => r.id !== 1)
      : roles;
    res.json({ success: true, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;