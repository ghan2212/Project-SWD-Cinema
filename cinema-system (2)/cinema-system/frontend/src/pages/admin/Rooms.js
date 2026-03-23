import React, { useState, useEffect } from 'react';
import { roomAPI, seatAPI } from '../../services/api';
import { toast } from 'react-toastify';

const RoomModal = ({ room, onClose, onSaved }) => {
  const [form, setForm] = useState(room || { name: '', total_seats: 80, status: 'active' });
  const [seatConfig, setSeatConfig] = useState({ rows: 8, cols: 10, vip_rows: 'D,E' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('info');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (room?.id) await roomAPI.update(room.id, form);
      else {
        const res = await roomAPI.create(form);
        // Auto-generate seats
        const vip_rows = seatConfig.vip_rows.split(',').map(s => s.trim()).filter(Boolean);
        await seatAPI.generate({ room_id: res.data.id, rows: parseInt(seatConfig.rows), cols: parseInt(seatConfig.cols), vip_rows });
      }
      toast.success('Lưu thành công');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
    finally { setSaving(false); }
  };

  const handleGenerateSeats = async () => {
    if (!room?.id) return;
    if (!window.confirm('Tạo lại ghế sẽ xóa tất cả ghế cũ. Tiếp tục?')) return;
    try {
      const vip_rows = seatConfig.vip_rows.split(',').map(s => s.trim()).filter(Boolean);
      await seatAPI.generate({ room_id: room.id, rows: parseInt(seatConfig.rows), cols: parseInt(seatConfig.cols), vip_rows });
      toast.success('Đã tạo ghế thành công');
      onSaved();
    } catch (err) { toast.error('Lỗi tạo ghế'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{room?.id ? 'SỬA PHÒNG' : 'THÊM PHÒNG CHIẾU'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {room?.id && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
            {['info', 'seats'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '10px 16px', background: 'none', border: 'none',
                color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer', fontSize: 14, fontWeight: 500,
                marginBottom: -1,
              }}>{t === 'info' ? '📋 Thông tin' : '💺 Cấu hình ghế'}</button>
            ))}
          </div>
        )}

        <div className="modal-body">
          {tab === 'info' && (
            <form onSubmit={handleSave} id="room-form">
              <div className="form-group">
                <label className="form-label">Tên phòng *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Hoạt động</option>
                  <option value="maintenance">Bảo trì</option>
                </select>
              </div>
              {!room?.id && (
                <>
                  <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>⚙️ Cấu hình ghế tự động</div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Số hàng</label>
                        <input className="form-input" type="number" value={seatConfig.rows} onChange={e => setSeatConfig({ ...seatConfig, rows: e.target.value })} min={1} max={26} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Số cột</label>
                        <input className="form-input" type="number" value={seatConfig.cols} onChange={e => setSeatConfig({ ...seatConfig, cols: e.target.value })} min={1} max={20} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hàng VIP (vd: D,E)</label>
                      <input className="form-input" value={seatConfig.vip_rows} onChange={e => setSeatConfig({ ...seatConfig, vip_rows: e.target.value })} placeholder="D,E" />
                    </div>
                  </div>
                </>
              )}
            </form>
          )}

          {tab === 'seats' && room?.id && (
            <div>
              <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>⚠️ Tạo lại sơ đồ ghế</div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Số hàng</label>
                    <input className="form-input" type="number" value={seatConfig.rows} onChange={e => setSeatConfig({ ...seatConfig, rows: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số cột</label>
                    <input className="form-input" type="number" value={seatConfig.cols} onChange={e => setSeatConfig({ ...seatConfig, cols: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Hàng VIP (cách nhau bởi dấu phẩy)</label>
                  <input className="form-input" value={seatConfig.vip_rows} onChange={e => setSeatConfig({ ...seatConfig, vip_rows: e.target.value })} />
                </div>
                <button className="btn btn-primary" onClick={handleGenerateSeats}>🔄 Tạo lại ghế</button>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Đóng</button>
          {tab === 'info' && (
            <button type="submit" form="room-form" className="btn btn-primary" disabled={saving}>{saving ? '...' : '💾 Lưu'}</button>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = () => {
    setLoading(true);
    roomAPI.getAll().then(r => setRooms(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Đặt phòng vào bảo trì?')) return;
    try { await roomAPI.delete(id); toast.success('Đã cập nhật'); load(); }
    catch { toast.error('Thất bại'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">PHÒNG CHIẾU PHIM</div>
          <div className="page-subtitle">{rooms.length} phòng chiếu</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>+ Thêm phòng</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
          : rooms.map(room => (
            <div key={room.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>🏠 {room.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>ID: {room.id}</div>
                </div>
                <span className={`badge ${room.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {room.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: 'center', flex: 1, background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 8px' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{room.total_seats}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Tổng ghế</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setModal(room)}>✏️ Chỉnh sửa</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(room.id)}>🗑️</button>
              </div>
            </div>
          ))}
      </div>

      {modal !== null && (
        <RoomModal room={modal?.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />
      )}
    </div>
  );
};

export default AdminRooms;
