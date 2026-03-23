import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { movieAPI, showtimeAPI } from '../../services/api';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const HomePage = () => {
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [todayShowtimes, setTodayShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [now, soon, times] = await Promise.all([
          movieAPI.getAll({ status: 'now_showing', limit: 8 }),
          movieAPI.getAll({ status: 'coming_soon', limit: 4 }),
          showtimeAPI.getAll({ show_date: today }),
        ]);
        setNowShowing(now.data.data);
        setComingSoon(soon.data.data);
        setTodayShowtimes(times.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const hero = nowShowing[0];

  return (
    <div>
      {/* Hero */}
      <div style={{
        minHeight: '70vh', position: 'relative', display: 'flex', alignItems: 'center',
        background: hero ? `linear-gradient(to right, rgba(10,10,15,0.95) 40%, rgba(10,10,15,0.6)), url(${hero?.poster_url}) right center/cover` : 'var(--bg-secondary)',
        padding: '60px 24px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%' }}>
          {hero && (
            <div style={{ maxWidth: 560 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <span className="badge badge-error">ĐÃ CHIẾU</span>
                <span className="badge badge-muted">{hero.age_rating}</span>
                <span className="badge badge-muted">{hero.language}</span>
              </div>
              <h1 style={{ fontFamily: 'Oswald', fontSize: 'clamp(40px, 8vw, 80px)', lineHeight: 1, marginBottom: 16 }}>
                {hero.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 24, maxWidth: 400 }}>
                {hero.description?.slice(0, 150)}...
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <Link to={`/movies/${hero.id}`} className="btn btn-primary btn-lg">🎬 Đặt vé ngay</Link>
                <Link to="/movies" className="btn btn-secondary btn-lg">Xem tất cả phim</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px' }}>
        {/* Now Showing */}
        <section style={{ marginBottom: 60 }}>
          <div className="flex-between mb-24">
            <div>
              <h2 style={{ fontFamily: 'Oswald', fontSize: 36 }}>🎭 ĐANG CHIẾU</h2>
              <p className="text-muted text-sm mt-8">Những bộ phim đang hot nhất hiện tại</p>
            </div>
            <Link to="/movies?status=now_showing" className="btn btn-outline btn-sm">Xem tất cả →</Link>
          </div>
          {loading ? (
            <div className="flex-center" style={{ height: 300 }}><div className="spinner" /></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {nowShowing.map(movie => (
                <div key={movie.id} className="movie-card" onClick={() => navigate(`/movies/${movie.id}`)}>
                  <img src={movie.poster_url || 'https://via.placeholder.com/300x450/1a1a28/e94560?text=No+Image'} alt={movie.title} />
                  <div className="movie-card-body">
                    <div className="movie-card-title">{movie.title}</div>
                    <div className="movie-card-meta">
                      <span>⏱ {movie.duration}p</span>
                      <span className="badge badge-muted" style={{ fontSize: 10 }}>{movie.age_rating}</span>
                    </div>
                    {movie.rating > 0 && <div style={{ marginTop: 6, color: 'var(--gold)', fontSize: 13 }}>⭐ {movie.rating}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Today Showtimes */}
        {todayShowtimes.length > 0 && (
          <section style={{ marginBottom: 60 }}>
            <div className="flex-between mb-24">
              <h2 style={{ fontFamily: 'Oswald', fontSize: 36 }}>🕐 LỊCH CHIẾU HÔM NAY</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...new Map(todayShowtimes.map(s => [s.movie_id, s])).values()].slice(0, 5).map(st => (
                <div key={st.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={st.poster_url} alt={st.movie_title} style={{ width: 56, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{st.movie_title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{st.room_name} • {st.duration} phút</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {todayShowtimes.filter(s => s.movie_id === st.movie_id).map(s => (
                      <button key={s.id} onClick={() => navigate(`/booking/${s.id}`)} style={{
                        padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                        cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text-primary)'; }}
                      >{s.start_time.slice(0,5)}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon */}
        {comingSoon.length > 0 && (
          <section>
            <div className="flex-between mb-24">
              <div>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: 36 }}>🔮 SẮP CHIẾU</h2>
                <p className="text-muted text-sm mt-8">Những bộ phim bom tấn sắp ra mắt</p>
              </div>
              <Link to="/movies?status=coming_soon" className="btn btn-outline btn-sm">Xem thêm →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {comingSoon.map(movie => (
                <div key={movie.id} className="movie-card" onClick={() => navigate(`/movies/${movie.id}`)}>
                  <div style={{ position: 'relative' }}>
                    <img src={movie.poster_url || 'https://via.placeholder.com/300x450/1a1a28/533483?text=Coming+Soon'} alt={movie.title} />
                    <div style={{ position: 'absolute', top: 10, left: 10 }}>
                      <span className="badge badge-warning">SẮP RA MẮT</span>
                    </div>
                  </div>
                  <div className="movie-card-body">
                    <div className="movie-card-title">{movie.title}</div>
                    <div className="movie-card-meta">
                      <span>📅 {movie.release_date && new Date(movie.release_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default HomePage;
