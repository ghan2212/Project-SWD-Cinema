import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showtimeAPI, seatAPI, bookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const SeatSelectionPage = () => {
  const { showtime_id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    Promise.all([showtimeAPI.getById(showtime_id), seatAPI.getByShowtime(showtime_id)])
      .then(([st, se]) => { setShowtime(st.data.data); setSeats(se.data.data); console.log("TOTAL SEATS:", se.data.data.length); })
      .catch(() => toast.error('Không thể tải dữ liệu'))
      .finally(() => setLoading(false));
  }, [showtime_id]);

//load lại ghế
const loadSeats = async () => {
  const se = await seatAPI.getByShowtime(showtime_id);
  setSeats(se.data.data);
};

useEffect(() => {
  loadSeats();

  const interval = setInterval(() => {
    loadSeats();
  }, 5000); // reload ghế mỗi 5s

  return () => clearInterval(interval);
}, [showtime_id]);

  const toggleSeat = (seat) => {
    if (seat.is_booked) return;
    setSelected(prev =>
      prev.find(s => s.id === seat.id) ? prev.filter(s => s.id !== seat.id) : [...prev, seat]
    );
  };

  const getPrice = (seat) => {
    if (!showtime) return 0;
    if (seat.seat_type === 'vip') return parseFloat(showtime.price_vip);
    if (seat.seat_type === 'couple') return parseFloat(showtime.price_couple);
    return parseFloat(showtime.price_standard);
  };

  const totalAmount = selected.reduce((sum, s) => sum + getPrice(s), 0);

  // Group seats by row
 // Group seats by row (ổn định hơn)
const rows = seats.reduce((acc, seat) => {
  const row = seat.seat_number.replace(/[0-9]/g, '');

  if (!acc[row]) acc[row] = [];
  acc[row].push(seat);

  return acc;
}, {});

  const handleBook = async () => {
    if (!selected.length) return toast.error('Vui lòng chọn ít nhất 1 ghế');
    setBooking(true);
    try {
      const res = await bookingAPI.create({ showtime_id: parseInt(showtime_id), seat_ids: selected.map(s => s.id) });
      toast.success('Đặt chỗ thành công!');
      navigate(`/payment/${res.data.booking_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt vé thất bại');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="flex-center" style={{ height: '70vh' }}><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      {showtime && (
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Bebas Neue', fontSize: 40 }}>{showtime.movie_title}</h1>
          <div style={{ display: 'flex', gap: 20, marginTop: 8, color: 'var(--text-secondary)', fontSize: 14, flexWrap: 'wrap' }}>
            <span>📅 {new Date(showtime.show_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span>🕐 {showtime.start_time?.slice(0,5)} - {showtime.end_time?.slice(0,5)}</span>
            <span>🏠 {showtime.room_name}</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* Seat map */}
        <div className="card">
          {/* Screen */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              background: 'linear-gradient(to bottom, var(--accent), transparent)',
              height: 6, borderRadius: 4, maxWidth: 400, margin: '0 auto 8px',
            }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>MÀN HÌNH</span>
          </div>

          {/* Seats */}
          <div className="seat-grid">
            {Object.entries(rows).sort().map(([row, rowSeats]) => (
              <div key={row} className="seat-row">
                <div className="seat-row-label">{row}</div>
                {rowSeats.sort((a, b) => {
  const na = Number(a.seat_number.match(/\d+/)[0]);
  const nb = Number(b.seat_number.match(/\d+/)[0]);
  return na - nb;
}).map(seat => (
                  <div key={seat.id}
                    className={`seat seat-${seat.seat_type} ${seat.is_booked ? 'booked' : ''} ${selected.find(s => s.id === seat.id) ? 'selected' : ''}`}
                    onClick={() => toggleSeat(seat)}
                    title={`${seat.seat_number} - ${seat.seat_type} - ${showtime ? formatCurrency(getPrice(seat)) : ''}`}
                  >
                    {seat.seat_number.replace(/^[A-Z]+/, '')}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            {[
              { cls: 'seat-standard', label: `Thường - ${showtime ? formatCurrency(showtime.price_standard) : ''}` },
              { cls: 'seat-vip', label: `VIP - ${showtime ? formatCurrency(showtime.price_vip) : ''}` },
              { cls: 'seat-couple', label: `Couple - ${showtime ? formatCurrency(showtime.price_couple) : ''}` },
              { cls: 'selected', label: 'Đã chọn' },
              { cls: 'booked', label: 'Đã đặt' },
            ].map(({ cls, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div className={`seat ${cls}`} style={{ width: 20, height: 18, fontSize: 8, cursor: 'default' }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📋 Tóm tắt đặt vé</h3>

            {selected.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Chưa chọn ghế nào</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {selected.map(seat => (
                  <div key={seat.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ghế {seat.seat_number} ({seat.seat_type})</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(getPrice(seat))}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Số ghế:</span>
                <span style={{ fontWeight: 600 }}>{selected.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Tổng tiền:</span>
                <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 18 }}>{formatCurrency(totalAmount)}</span>
              </div>
              <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }}
                onClick={handleBook} disabled={booking || !selected.length}>
                {booking ? '⏳ Đang xử lý...' : '🎟️ Tiếp tục thanh toán'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPage;
