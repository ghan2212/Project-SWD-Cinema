import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { movieAPI } from '../../services/api';

const MoviesPage = () => {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    movieAPI.getCategories().then(r => setCategories(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (status) params.status = status;
    if (category) params.category_id = category;
    if (search) params.search = search;

    movieAPI.getAll(params).then(r => {
      setMovies(r.data.data);
      setTotal(r.data.total);
    }).catch(console.error).finally(() => setLoading(false));
  }, [status, category, page, search]);

  const setFilter = (key, val) => {
    const p = new URLSearchParams(searchParams);
    if (val) p.set(key, val); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const statusOptions = [
    { val: '', label: 'Tất cả' },
    { val: 'now_showing', label: '🎭 Đang chiếu' },
    { val: 'coming_soon', label: '🔮 Sắp chiếu' },
    { val: 'ended', label: '📼 Đã kết thúc' },
  ];

  const totalPages = Math.ceil(total / 12);

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Oswald', fontSize: 48 }}>DANH SÁCH PHIM</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{total} bộ phim</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="form-input" placeholder="🔍 Tìm kiếm phim..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          {statusOptions.map(opt => (
            <button key={opt.val} onClick={() => setFilter('status', opt.val)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid',
              borderColor: status === opt.val ? 'var(--accent)' : 'var(--border)',
              background: status === opt.val ? 'var(--accent-dim)' : 'transparent',
              color: status === opt.val ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>{opt.label}</button>
          ))}
        </div>
        <select className="form-select" value={category} onChange={e => setFilter('category', e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">Tất cả thể loại</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex-center" style={{ height: 400 }}><div className="spinner" /></div>
      ) : movies.length === 0 ? (
        <div className="flex-center" style={{ height: 400, flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 48 }}>🎬</span>
          <p style={{ color: 'var(--text-secondary)' }}>Không tìm thấy phim nào</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
          {movies.map(movie => (
            <div key={movie.id} className="movie-card" onClick={() => navigate(`/movies/${movie.id}`)}>
              <div style={{ position: 'relative' }}>
                <img src={movie.poster_url || 'https://via.placeholder.com/300x450/1a1a28/e94560?text=No+Image'} alt={movie.title} />
                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                  {movie.status === 'now_showing' && <span className="badge badge-error" style={{ fontSize: 10 }}>CHIẾU</span>}
                  {movie.status === 'coming_soon' && <span className="badge badge-warning" style={{ fontSize: 10 }}>SẮP RA</span>}
                </div>
              </div>
              <div className="movie-card-body">
                <div className="movie-card-title">{movie.title}</div>
                <div className="movie-card-meta">
                  <span>{movie.category_name}</span>
                  <span>⏱ {movie.duration}p</span>
                </div>
                {movie.rating > 0 && <div style={{ color: 'var(--gold)', fontSize: 12, marginTop: 4 }}>⭐ {movie.rating}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setFilter('page', p)} style={{
              width: 36, height: 36, borderRadius: 8, border: '1px solid',
              borderColor: page === p ? 'var(--accent)' : 'var(--border)',
              background: page === p ? 'var(--accent)' : 'transparent',
              color: page === p ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: 600,
            }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MoviesPage;
