import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

 useEffect(() => {
  bookingAPI.getById(id)
    .then(r => {
      console.log(r.data.data);   // xem dữ liệu thật
      setBooking(r.data.data);
    })
    .finally(() => setLoading(false));
}, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy vé?')) return;
    setCancelling(true);
    try {
      await bookingAPI.cancel(id);
      toast.success('Đã hủy vé');
      setBooking(b => ({ ...b, status: 'cancelled' }));
    } catch (err) {
      toast.error('Hủy thất bại');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;
  if (!booking) return <div className="flex-center" style={{ height: '60vh' }}>Không tìm thấy</div>;

  const statusMap = { pending: ['badge-warning', 'Chờ thanh toán'], confirmed: ['badge-success', 'Đã xác nhận'], cancelled: ['badge-error', 'Đã hủy'], completed: ['badge-info', 'Hoàn thành'] };
  const [cls, label] = statusMap[booking.status] || ['badge-muted', booking.status];

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <button onClick={() => navigate('/my-bookings')} className="btn btn-ghost btn-sm">← Quay lại</button>
        <h1 style={{ fontFamily: 'Oswald', fontSize: 36 }}>CHI TIẾT ĐẶT VÉ #{id}</h1>
        <span className={`badge ${cls}`}>{label}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🎬 Thông tin phim</h3>
          <div style={{ display: 'flex', gap: 16 }}>
            <img src={booking.poster_url} alt={booking.movie_title} style={{ width: 90, borderRadius: 8 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{booking.movie_title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span>📅 {new Date(booking.show_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                <span>🕐 {booking.start_time?.slice(0,5)} - {booking.end_time?.slice(0,5)}</span>
                <span>🏠 {booking.room_name}</span>
                <span>⏱ {booking.duration} phút | {booking.age_rating} | {booking.language}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💺 Ghế đã đặt</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {booking.seats?.map(s => (
              <div key={s.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 14 }}>
                <span style={{ fontWeight: 700 }}>{s.seat_number}</span>
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6, fontSize: 12 }}>{s.seat_type}</span>
                <span style={{ color: 'var(--accent)', marginLeft: 8 }}>{formatCurrency(s.price)}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Tổng tiền</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 20 }}>{formatCurrency(booking.total_amount)}</span>
          </div>
        </div>

        {booking.payment && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💳 Thông tin thanh toán</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
              <div className="flex-between"><span style={{ color: 'var(--text-secondary)' }}>Phương thức</span><span>{booking.payment.method?.toUpperCase()}</span></div>
              <div className="flex-between"><span style={{ color: 'var(--text-secondary)' }}>Mã giao dịch</span><span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{booking.payment.transaction_code}</span></div>
              <div className="flex-between"><span style={{ color: 'var(--text-secondary)' }}>Thời gian</span><span>{booking.payment.paid_at && new Date(booking.payment.paid_at).toLocaleString('vi-VN')}</span></div>
              <div className="flex-between"><span style={{ color: 'var(--text-secondary)' }}>Trạng thái</span><span className="badge badge-success">Thành công</span></div>
            </div>
          </div>
        )}
{booking.ticket && booking.status === 'paid' && (
  <div className="card" style={{ textAlign: 'center' }}>
    <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🎟️ Vé điện tử</h3>

    <img
      src={booking.ticket.qr_code?.includes('data:image')
        ? booking.ticket.qr_code.slice(booking.ticket.qr_code.indexOf('data:image'))
        : booking.ticket.qr_code}
      alt="QR Code"
      style={{ width: 180, height: 180, margin: '0 auto 12px', display: 'block' }}
    />

    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
      Xuất trình mã QR này tại quầy vé
    </p>

    <span className={`badge ${booking.ticket.status === 'valid' ? 'badge-success' : 'badge-muted'}`} style={{ marginTop: 8 }}>
      {booking.ticket.status === 'valid' ? '✓ Còn hiệu lực' : 'Đã sử dụng'}
    </span>
  </div>
)}

        {booking.status === 'pending' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={`/payment/${id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>💳 Thanh toán ngay</Link>
            <button className="btn btn-danger" onClick={handleCancel} disabled={cancelling}>{cancelling ? '...' : '🗑️ Hủy vé'}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetailPage;
