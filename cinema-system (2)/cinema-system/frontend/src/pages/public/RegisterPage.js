import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterPage = () => {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Mật khẩu không khớp');
    if (form.password.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự');
    setLoading(true);
    try {
      await register({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password });
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 16,
      backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(233,69,96,0.08) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/"><span style={{ fontFamily: 'Bebas Neue', fontSize: 32 }}>🎬 CINEMAX</span></Link>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>Tạo tài khoản mới</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input className="form-input" placeholder="Nguyễn Văn A" value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="email@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input className="form-input" placeholder="0901234567" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận</label>
                <input className="form-input" type="password" placeholder="••••••••" value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 8, justifyContent: 'center' }} disabled={loading}>
              {loading ? '⏳ Đang tạo...' : '✨ Đăng ký'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
