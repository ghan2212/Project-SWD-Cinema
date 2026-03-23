import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Chào mừng, ${user.full_name}!`);
      if (['admin', 'manager', 'ticket_staff'].includes(user.role_name)) navigate('/admin');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 16,
      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(233,69,96,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(83,52,131,0.08) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 44, height: 44, background: 'var(--accent)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎬</div>
              <span style={{ fontFamily: 'Bebas Neue', fontSize: 32, letterSpacing: '0.1em' }}>CINEMAX</span>
            </div>
          </Link>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Đăng nhập để tiếp tục</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="email@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 8, justifyContent: 'center' }} disabled={loading}>
              {loading ? '⏳ Đang đăng nhập...' : '🚀 Đăng nhập'}
            </button>
          </form>

         
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: 'var(--text-secondary)' }}>
          Chưa có tài khoản?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
