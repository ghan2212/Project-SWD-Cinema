import React, { useState, useEffect } from 'react';
import { movieAPI } from '../../services/api';
import { toast } from 'react-toastify';

const statusOpts = [
  { val: 'coming_soon', label: 'Sắp chiếu' },
  { val: 'now_showing', label: 'Đang chiếu' },
  { val: 'ended', label: 'Đã kết thúc' },
];

const MovieModal = ({ movie, categories, onClose, onSaved }) => {
  const [form, setForm] = useState(movie || { title: '', description: '', duration: 90, release_date: '', status: 'coming_soon', category_id: '', poster_url: '', trailer_url: '', director: '', cast_members: '', language: 'Vietnamese', age_rating: 'P' });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (movie?.id) await movieAPI.update(movie.id, form);
      else await movieAPI.create(form);
      toast.success(movie?.id ? 'Cập nhật thành công' : 'Thêm phim thành công');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <div className="modal-title">{movie?.id ? 'SỬA PHIM' : 'THÊM PHIM MỚI'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Tên phim *</label>
                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Thời lượng (phút)</label>
                <input className="form-input" type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Ngày khởi chiếu</label>
                <input className="form-input" type="date" value={form.release_date?.split('T')[0] || ''} onChange={e => setForm({ ...form, release_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {statusOpts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Thể loại</label>
                <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">-- Chọn thể loại --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ngôn ngữ</label>
                <input className="form-input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phân loại tuổi</label>
                <select className="form-select" value={form.age_rating} onChange={e => setForm({ ...form, age_rating: e.target.value })}>
                  {['P', 'T13', 'T16', 'T18', 'C'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Đạo diễn</label>
                <input className="form-input" value={form.director} onChange={e => setForm({ ...form, director: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Diễn viên</label>
                <input className="form-input" value={form.cast_members} onChange={e => setForm({ ...form, cast_members: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">URL Poster</label>
                <input className="form-input" value={form.poster_url} onChange={e => setForm({ ...form, poster_url: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Mô tả</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
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

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      movieAPI.getAll({ limit: 100, status: statusFilter || undefined, search: search || undefined }),
      movieAPI.getCategories(),
    ]).then(([m, c]) => { setMovies(m.data.data); setCategories(c.data.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa phim này?')) return;
    try { await movieAPI.delete(id); toast.success('Đã xóa'); load(); }
    catch { toast.error('Xóa thất bại'); }
  };

  const statusLabel = { coming_soon: ['badge-warning', 'Sắp chiếu'], now_showing: ['badge-success', 'Đang chiếu'], ended: ['badge-muted', 'Kết thúc'] };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">QUẢN LÝ PHIM</div>
          <div className="page-subtitle">{movies.length} phim trong hệ thống</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>+ Thêm phim</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="🔍 Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">Tất cả trạng thái</option>
          {statusOpts.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
        </select>
      </div>

      <div className="card">
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Phim</th><th>Thể loại</th><th>Thời lượng</th><th>Khởi chiếu</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {movies.map(m => {
                  const [cls, label] = statusLabel[m.status] || ['badge-muted', m.status];
                  return (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={m.poster_url} alt={m.title} style={{ width: 36, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{m.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.director}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.category_name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.duration} phút</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{m.release_date ? new Date(m.release_date).toLocaleDateString('vi-VN') : '-'}</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => setModal(m)}>✏️ Sửa</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <MovieModal movie={modal?.id ? modal : null} categories={categories} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
};

export default AdminMovies;
