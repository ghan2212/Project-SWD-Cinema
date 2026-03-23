const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { auth } = require('../middleware/auth');
 
const JWT_SECRET = process.env.JWT_SECRET || 'cinema_secret_key_2024';
 
// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }
 
    const [users] = await db.query(
      `SELECT u.*, r.name as role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );
    if (!users.length) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }
 
    const user = users[0];
    if (user.status === 'banned') {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    }
    if (user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Tài khoản chưa được kích hoạt' });
    }
 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }
 
    const token = jwt.sign(
      { id: user.id, role: user.role_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
 
    delete user.password;
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// POST /api/auth/register - Chỉ đăng ký customer (role_id = 4)
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    }
 
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Email đã được đăng ký' });
    }
 
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, phone, password, role_id) VALUES (?, ?, ?, ?, 4)',
      [full_name, email, phone, hashed]
    );
 
    const token = jwt.sign(
      { id: result.insertId, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
 
    res.status(201).json({
      success: true,
      token,
      user: { id: result.insertId, full_name, email, phone, role_name: 'customer' }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// GET /api/auth/me - Lấy thông tin user hiện tại (dùng để restore session)
router.get('/me', auth, async (req, res) => {
  try {
    // Lấy lại từ DB để có role_name mới nhất
    const [users] = await db.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.status, u.created_at,
       r.name as role_name, r.id as role_id
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [req.user.id]
    );
    if (!users.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: users[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// PUT /api/auth/profile - Cập nhật thông tin cá nhân
router.put('/profile', auth, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    if (!full_name) return res.status(400).json({ success: false, message: 'Tên không được để trống' });
    await db.query('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', [full_name, phone, req.user.id]);
    res.json({ success: true, message: 'Cập nhật hồ sơ thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// PUT /api/auth/change-password - Đổi mật khẩu
router.put('/change-password', auth, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ mật khẩu cũ và mới' });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải ít nhất 6 ký tự' });
    }
 
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, users[0].password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }
 
    const hashed = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;
 