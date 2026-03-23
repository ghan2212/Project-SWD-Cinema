import React, { useState, useEffect } from 'react';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';

const roleMap = { admin: ['badge-error', 'Admin'], manager: ['badge-warning', 'Manager'], ticket_staff: ['badge-info', 'Staff'], customer: ['badge-muted', 'Customer'] };

const UserModal = ({ user, onClose, onSaved }) => {
  const [form, setForm] = useState(user || { full_name: '', email: '', phone: '', password: '', role_id: 4, status: 'active' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user?.id) await userAPI.update(user.id, { full_name: form.full_name, phone: form.phone, status: form.status, role_id: form.role_id });
      else await userAPI.create(form);
      toast.success('Lưu thành công');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{user?.id ? 'SỬA NGƯỜI DÙNG' : 'THÊM NGƯỜI DÙNG'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Họ và tên *</label>
              <input className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            {!user?.id && (
              <>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mật khẩu *</label>
                  <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
              </>
            )}
            <div className="form-group">
              <label className="form-label">Số điện thoại</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Vai trò</label>
                <select className="form-select" value={form.role_id} onChange={e => setForm({ ...form, role_id: parseInt(e.target.value) })}>
                  <option value={1}>Admin</option>
                  <option value={2}>Manager</option>
                  <option value={3}>Ticket Staff</option>
                  <option value={4}>Customer</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Không HĐ</option>
                  <option value="banned">Bị khóa</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : '💾 Lưu'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const load = () => {
    setLoading(true);
    userAPI.getAll().then(r => setUsers(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleBan = async (id) => {
    if (!window.confirm('Khóa tài khoản này?')) return;
    try { await userAPI.ban(id); toast.success('Đã khóa'); load(); }
    catch { toast.error('Thất bại'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role_name === roleFilter;
    return matchSearch && matchRole;
  });

  const statusBadge = { active: ['badge-success', 'Hoạt động'], inactive: ['badge-warning', 'Không HĐ'], banned: ['badge-error', 'Bị khóa'] };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">QUẢN LÝ NGƯỜI DÙNG</div>
          <div className="page-subtitle">{users.length} người dùng</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>+ Thêm người dùng</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="🔍 Tìm tên, email..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="ticket_staff">Ticket Staff</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      <div className="card">
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const [rcls, rlabel] = roleMap[u.role_name] || ['badge-muted', u.role_name];
                  const [scls, slabel] = statusBadge[u.status] || ['badge-muted', u.status];
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                            {u.full_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: {u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{u.email}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.phone}</div>
                      </td>
                      <td><span className={`badge ${rcls}`}>{rlabel}</span></td>
                      <td><span className={`badge ${scls}`}>{slabel}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(u)}>✏️</button>
                          {u.status !== 'banned' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleBan(u.id)}>🚫</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex-center" style={{ height: 120, color: 'var(--text-muted)' }}>Không tìm thấy</div>
            )}
          </div>
        )}
      </div>

      {modal !== null && (
        <UserModal user={modal?.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
};

export default AdminUsers;
