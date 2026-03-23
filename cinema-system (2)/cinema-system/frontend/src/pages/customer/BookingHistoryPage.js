// BookingHistoryPage.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export const BookingHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    bookingAPI.getAll().then(r => setBookings(r.data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;

  const statusBadge = (s) => {
    const map = { pending: ['badge-warning', 'Chờ thanh toán'], confirmed: ['badge-success', 'Đã xác nhận'], cancelled: ['badge-error', 'Đã hủy'], completed: ['badge-info', 'Hoàn thành'] };
    return map[s] || ['badge-muted', s];
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Oswald', fontSize: 40, marginBottom: 24 }}>LỊCH SỬ ĐẶT VÉ</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['', 'Tất cả'], ['pending', 'Chờ TT'], ['confirmed', 'Đã xác nhận'], ['cancelled', 'Đã hủy']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            borderColor: filter === val ? 'var(--accent)' : 'var(--border)',
            background: filter === val ? 'var(--accent-dim)' : 'transparent',
            color: filter === val ? 'var(--accent)' : 'var(--text-secondary)',
          }}>{label}</button>
        ))}
      </div>

      {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>
        : filtered.length === 0 ? (
          <div className="card flex-center" style={{ height: 200, flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 40 }}>🎟️</span>
            <p style={{ color: 'var(--text-secondary)' }}>Chưa có đơn đặt vé nào</p>
            <Link to="/movies" className="btn btn-primary btn-sm">Đặt vé ngay</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(b => {
              const [cls, label] = statusBadge(b.status);
              return (
                <div key={b.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => navigate(`/my-bookings/${b.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <img src={b.poster_url} alt={b.movie_title} style={{ width: 64, height: 90, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{b.movie_title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        📅 {new Date(b.show_date).toLocaleDateString('vi-VN')} | 🕐 {b.start_time?.slice(0,5)} | 🏠 {b.room_name}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {b.seats?.map(s => s.seat_number).join(', ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={`badge ${cls}`}>{label}</span>
                      <div style={{ fontWeight: 700, color: 'var(--accent)', marginTop: 8 }}>{formatCurrency(b.total_amount)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
};

export default BookingHistoryPage;
