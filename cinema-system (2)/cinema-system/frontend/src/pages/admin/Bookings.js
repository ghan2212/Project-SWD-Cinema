import React, { useState, useEffect } from 'react';
import { bookingAPI } from '../../services/api';
import { toast } from 'react-toastify';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const statusMap = { pending: ['badge-warning', 'Chờ TT'], confirmed: ['badge-success', 'Đã xác nhận'], cancelled: ['badge-error', 'Đã hủy'], completed: ['badge-info', 'Hoàn thành'] };

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = () => {
    setLoading(true);
    bookingAPI.getAll(statusFilter ? { status: statusFilter } : {})
      .then(r => setBookings(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleConfirm = async (id) => {
    try { await bookingAPI.confirm(id); toast.success('Đã xác nhận'); load(); }
    catch { toast.error('Thất bại'); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Hủy đơn này?')) return;
    try { await bookingAPI.cancel(id); toast.success('Đã hủy'); load(); }
    catch { toast.error('Thất bại'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">QUẢN LÝ ĐẶT VÉ</div>
          <div className="page-subtitle">{bookings.length} đơn đặt vé</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['', 'Tất cả'], ['pending', 'Chờ TT'], ['confirmed', 'Đã xác nhận'], ['cancelled', 'Đã hủy']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, cursor: 'pointer',
            borderColor: statusFilter === val ? 'var(--accent)' : 'var(--border)',
            background: statusFilter === val ? 'var(--accent-dim)' : 'transparent',
            color: statusFilter === val ? 'var(--accent)' : 'var(--text-secondary)',
          }}>{label}</button>
        ))}
      </div>

      <div className="card">
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Khách hàng</th><th>Phim / Suất chiếu</th><th>Ghế</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
              <tbody>
                {bookings.map(b => {
                  const [cls, label] = statusMap[b.status] || ['badge-muted', b.status];
                  return (
                    <tr key={b.id}>
                      <td style={{ color: 'var(--text-secondary)' }}>#{b.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{b.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{b.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{b.movie_title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(b.show_date).toLocaleDateString('vi-VN')} {b.start_time?.slice(0,5)}</div>
                      </td>
                      <td style={{ fontSize: 13 }}>{b.seats?.map(s => s.seat_number).join(', ')}</td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatCurrency(b.total_amount)}</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {b.status === 'pending' && <button className="btn btn-success btn-sm" onClick={() => handleConfirm(b.id)}>✓ XN</button>}
                          {['pending', 'confirmed'].includes(b.status) && <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.id)}>✕</button>}
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
    </div>
  );
};

export default AdminBookings;
