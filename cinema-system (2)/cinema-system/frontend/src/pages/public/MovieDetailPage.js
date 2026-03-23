import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieAPI, showtimeAPI } from '../../services/api';

const formatDate = (d) => new Date(d).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([movieAPI.getById(id), showtimeAPI.getAll({ movie_id: id })])
      .then(([m, s]) => {
        setMovie(m.data.data);
        const sts = s.data.data;
        setShowtimes(sts);
        const uniqueDates = [...new Set(sts.map(st => st.show_date))].sort().slice(0, 7);
        setDates(uniqueDates);
        if (uniqueDates.length) setSelectedDate(uniqueDates[0]);
      }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const filteredShowtimes = showtimes.filter(s => s.show_date === selectedDate);

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;
  if (!movie) return <div className="flex-center" style={{ height: '60vh' }}>Không tìm thấy phim</div>;

  return (
    <div>
      {/* Hero Banner */}
      <div style={{
        background: `linear-gradient(to bottom, rgba(10,10,15,0.7) 0%, rgba(10,10,15,1) 100%), url(${movie.poster_url}) center/cover`,
        padding: '60px 24px 40px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 40, alignItems: 'flex-start' }}>
          <img src={movie.poster_url} alt={movie.title} style={{ width: 220, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className={`badge ${movie.status === 'now_showing' ? 'badge-error' : 'badge-warning'}`}>
                {movie.status === 'now_showing' ? 'ĐANG CHIẾU' : 'SẮP CHIẾU'}
              </span>
              <span className="badge badge-muted">{movie.age_rating}</span>
              <span className="badge badge-muted">{movie.language}</span>
              {movie.category_name && <span className="badge badge-info">{movie.category_name}</span>}
            </div>
            <h1 style={{ fontFamily: 'Oswald', fontSize: 'clamp(32px, 6vw, 60px)', lineHeight: 1, marginBottom: 16 }}>{movie.title}</h1>

            <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>⏱ <strong style={{ color: 'var(--text-primary)' }}>{movie.duration} phút</strong></div>
              {movie.release_date && <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>📅 <strong style={{ color: 'var(--text-primary)' }}>{new Date(movie.release_date).toLocaleDateString('vi-VN')}</strong></div>}
              {movie.director && <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>🎬 <strong style={{ color: 'var(--text-primary)' }}>{movie.director}</strong></div>}
              {movie.rating > 0 && <div style={{ color: 'var(--gold)', fontSize: 14 }}>⭐ <strong>{movie.rating}/10</strong></div>}
            </div>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 600, marginBottom: 20 }}>{movie.description}</p>
            {movie.cast_members && (
              <div style={{ fontSize: 14 }}><span style={{ color: 'var(--text-secondary)' }}>Diễn viên: </span>{movie.cast_members}</div>
            )}
          </div>
        </div>
      </div>

      {/* Showtimes */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        {movie.status === 'now_showing' && (
          <div>
            <h2 style={{ fontFamily: 'Oswald', fontSize: 36, marginBottom: 24 }}>🕐 LỊCH CHIẾU</h2>

            {dates.length === 0 ? (
              <div className="card flex-center" style={{ height: 120 }}>
                <p style={{ color: 'var(--text-secondary)' }}>Chưa có lịch chiếu</p>
              </div>
            ) : (
              <>
                {/* Date selector */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                  {dates.map(date => (
                    <button key={date} onClick={() => setSelectedDate(date)} style={{
                      padding: '10px 18px', borderRadius: 10, border: '1px solid',
                      borderColor: selectedDate === date ? 'var(--accent)' : 'var(--border)',
                      background: selectedDate === date ? 'var(--accent)' : 'var(--bg-card)',
                      color: selectedDate === date ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      transition: 'all 0.2s',
                    }}>{formatDate(date)}</button>
                  ))}
                </div>

                {/* Showtimes grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[...new Map(filteredShowtimes.map(s => [s.room_id, s])).values()].map(room => (
                    <div key={room.room_id} className="card">
                      <div style={{ fontWeight: 600, marginBottom: 12 }}> {room.room_name}</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {filteredShowtimes.filter(s => s.room_id === room.room_id).map(st => (
                          <button key={st.id} onClick={() => navigate(`/booking/${st.id}`)} style={{
                            padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)', cursor: 'pointer',
                            transition: 'all 0.2s', textAlign: 'left',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                          >
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>{st.start_time.slice(0,5)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                              {new Intl.NumberFormat('vi-VN').format(st.price_standard)}đ
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {movie.status === 'coming_soon' && (
          <div className="card flex-center" style={{ height: 160, flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 48 }}>🔮</span>
            <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>Phim sẽ ra mắt vào {movie.release_date && new Date(movie.release_date).toLocaleDateString('vi-VN')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieDetailPage;
