import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const PaymentPage = () => {
  const { booking_id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    bookingAPI.getById(booking_id)
      .then(r => setBooking(r.data.data))
      .catch(() => toast.error('Không tìm thấy đơn đặt vé'))
      .finally(() => setLoading(false));
  }, [booking_id]);

  const handlePayment = async () => {
    setPaying(true);
    try {
      await paymentAPI.create({ booking_id: parseInt(booking_id), method });
      toast.success('Thanh toán thành công! 🎉');
      navigate(`/my-bookings/${booking_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thanh toán thất bại');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '70vh' }}><div className="spinner" /></div>;
  if (!booking) return <div className="flex-center" style={{ height: '70vh' }}>Không tìm thấy đơn hàng</div>;

  const methods = [
    // { id: 'vnpay', icon: '💳', label: 'VNPay', desc: 'Thanh toán qua VNPay' },
    // { id: 'card', icon: '🏦', label: 'Thẻ ngân hàng', desc: 'ATM / Visa / MasterCard' },
    { id: 'cash', icon: '💵', label: 'Tiền mặt', desc: 'Thanh toán tại quầy' },
  ];
// const methods = [
//   { id: 'cash', icon: '💵', label: 'Tiền mặt', desc: 'Thanh toán tại quầy' },
// ];
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 40, marginBottom: 8 }}>THANH TOÁN</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Hoàn tất thanh toán để nhận vé</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Booking summary */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🎬 Thông tin đặt vé</h3>
            <div style={{ display: 'flex', gap: 16 }}>
              <img src={booking.poster_url} alt={booking.movie_title} style={{ width: 80, borderRadius: 8 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{booking.movie_title}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
                  📅 {new Date(booking.show_date).toLocaleDateString('vi-VN')} | 🕐 {booking.start_time?.slice(0,5)}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>🏠 {booking.room_name}</div>
                <div style={{ marginTop: 8 }}>
                  {booking.seats?.map(s => (
                    <span key={s.id} style={{ display: 'inline-block', background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4, fontSize: 12, marginRight: 4, marginTop: 4 }}>
                      {s.seat_number}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment method */}
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>💳 Phương thức thanh toán</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {methods.map(m => (
                <label key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 10, border: '1px solid',
                  borderColor: method === m.id ? 'var(--accent)' : 'var(--border)',
                  background: method === m.id ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} style={{ display: 'none' }} />
                  <span style={{ fontSize: 24 }}>{m.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{m.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{m.desc}</div>
                  </div>
                  {method === m.id && <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 18 }}>✓</span>}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Tổng đơn hàng</h3>
            {booking.seats?.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ghế {s.seat_number}</span>
                <span>{formatCurrency(s.price)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                <span>Tổng cộng</span>
                <span style={{ color: 'var(--accent)' }}>{formatCurrency(booking.total_amount)}</span>
              </div>
            </div>
            <button className="btn btn-primary w-full" style={{ marginTop: 20, justifyContent: 'center', padding: '14px' }}
              onClick={handlePayment} disabled={paying}>
              {paying ? '⏳ Đang xử lý...' : `💳 Thanh toán ${formatCurrency(booking.total_amount)}`}
            </button>
            <button className="btn btn-ghost w-full" style={{ marginTop: 8, justifyContent: 'center' }}
              onClick={() => navigate(-1)}>← Quay lại</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
