import React, { useState, useEffect } from 'react';
import { showtimeAPI, movieAPI, roomAPI } from '../../services/api';
import { toast } from 'react-toastify';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n);

const ShowtimeModal = ({ showtime, movies, rooms, onClose, onSaved }) => {
  const [form, setForm] = useState(showtime || {
    movie_id: '', room_id: '', start_time: '', show_date: '', price_standard: 90000, price_vip: 120000, price_couple: 200000
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (showtime?.id) await showtimeAPI.update(showtime.id, form);
      else await showtimeAPI.create(form);
      toast.success('Lưu thành công');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{showtime?.id ? 'SỬA LỊCH CHIẾU' : 'THÊM LỊCH CHIẾU'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Phim *</label>
              <select className="form-select" value={form.movie_id} onChange={e => setForm({ ...form, movie_id: e.target.value })} required>
                <option value="">-- Chọn phim --</option>
                {movies.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phòng chiếu *</label>
              <select className="form-select" value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })} required>
                <option value="">-- Chọn phòng --</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.total_seats} ghế)</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Ngày chiếu *</label>
                <input className="form-input" type="date" value={form.show_date} onChange={e => setForm({ ...form, show_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Giờ chiếu *</label>
                <input className="form-input" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Giá ghế thường (đ)</label>
                <input className="form-input" type="number" value={form.price_standard} onChange={e => setForm({ ...form, price_standard: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Giá ghế VIP (đ)</label>
                <input className="form-input" type="number" value={form.price_vip} onChange={e => setForm({ ...form, price_vip: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Giá ghế Couple (đ)</label>
                <input className="form-input" type="number" value={form.price_couple} onChange={e => setForm({ ...form, price_couple: e.target.value })} />
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

const AdminShowtimes = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [dateFilter, setDateFilter] = useState('');

  const load = () => {
    setLoading(true);
    const params = { status: 'active' };
    if (dateFilter) params.show_date = dateFilter;
    Promise.all([
      showtimeAPI.getAll(params),
      movieAPI.getAll({ limit: 100 }),
      roomAPI.getAll(),
    ]).then(([s, m, r]) => { setShowtimes(s.data.data); setMovies(m.data.data); setRooms(r.data.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [dateFilter]);

  const handleCancel = async (id) => {
    if (!window.confirm('Hủy lịch chiếu này?')) return;
    try { await showtimeAPI.cancel(id); toast.success('Đã hủy'); load(); }
    catch { toast.error('Thất bại'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">LỊCH CHIẾU</div>
          <div className="page-subtitle">{showtimes.length} buổi chiếu</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>+ Thêm lịch chiếu</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input className="form-input" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{ maxWidth: 200 }} />
        {dateFilter && <button className="btn btn-ghost btn-sm" onClick={() => setDateFilter('')}>✕ Xóa lọc</button>}
      </div>

      <div className="card">
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Phim</th><th>Phòng</th><th>Ngày chiếu</th><th>Giờ</th><th>Giá vé</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {showtimes.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.movie_title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.duration} phút</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.room_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(s.show_date).toLocaleDateString('vi-VN')}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{s.start_time?.slice(0,5)}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}> - {s.end_time?.slice(0,5)}</span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <div style={{ color: 'var(--text-secondary)' }}>T: {formatCurrency(s.price_standard)}đ</div>
                      <div style={{ color: 'var(--gold)' }}>VIP: {formatCurrency(s.price_vip)}đ</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal(s)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(s.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <ShowtimeModal showtime={modal?.id ? modal : null} movies={movies} rooms={rooms} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
};

export default AdminShowtimes;
