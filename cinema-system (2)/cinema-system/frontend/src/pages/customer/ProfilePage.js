import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ProfilePage = () => {
  const { user, login } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      toast.success('Cập nhật thành công');
    } catch { toast.error('Cập nhật thất bại'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Mật khẩu không khớp');
    setChangingPw(true);
    try {
      await authAPI.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Đổi mật khẩu thành công');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally { setChangingPw(false); }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 40, marginBottom: 32 }}>HỒ SƠ CÁ NHÂN</h1>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 72, height: 72, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 }}>
          {user?.full_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 20 }}>{user?.full_name}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user?.email}</div>
          <span className={`badge ${user?.role_name === 'admin' ? 'badge-error' : user?.role_name === 'manager' ? 'badge-warning' : 'badge-info'}`} style={{ marginTop: 4 }}>
            {user?.role_name}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>✏️ Thông tin cá nhân</h3>
          <form onSubmit={handleProfile}>
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <input className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : '💾 Lưu thay đổi'}</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🔒 Đổi mật khẩu</h3>
          <form onSubmit={handlePassword}>
            <div className="form-group">
              <label className="form-label">Mật khẩu hiện tại</label>
              <input className="form-input" type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input className="form-input" type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận</label>
                <input className="form-input" type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={changingPw}>{changingPw ? '...' : '🔑 Đổi mật khẩu'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
