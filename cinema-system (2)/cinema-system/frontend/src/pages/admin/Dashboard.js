import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats().then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: '60vh' }}><div className="spinner" /></div>;

  const statCards = [
    { icon: '🎬', label: 'Tổng phim', value: stats?.total_movies || 0, bg: '#e94560', sub: `${stats?.now_showing || 0} đang chiếu` },
    { icon: '🎟️', label: 'Đơn đặt vé', value: stats?.total_bookings || 0, bg: '#00d4aa', sub: `${stats?.today_bookings || 0} hôm nay` },
    { icon: '👥', label: 'Khách hàng', value: stats?.total_users || 0, bg: '#f5c518', sub: 'Tài khoản đã đăng ký' },
    { icon: '💰', label: 'Doanh thu', value: formatCurrency(stats?.total_revenue || 0), bg: '#6366f1', sub: `Hôm nay: ${formatCurrency(stats?.today_revenue || 0)}` },
  ];

  const statusMap = { pending: ['badge-warning', 'Chờ TT'], confirmed: ['badge-success', 'XN'], cancelled: ['badge-error', 'Hủy'], completed: ['badge-info', 'Xong'] };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">DASHBOARD</div>
          <div className="page-subtitle">Tổng quan hệ thống Cinema</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {statCards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: c.bg + '22' }}>
              <span style={{ fontSize: 24 }}>{c.icon}</span>
            </div>
            <div>
              <div className="stat-value" style={{ color: c.bg }}>{c.value}</div>
              <div className="stat-label">{c.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Revenue chart */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 20 }}>📈 Doanh thu 7 ngày</div>
          {stats?.revenue_chart?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.revenue_chart.map(d => ({ ...d, revenue: parseFloat(d.revenue) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#8888aa', fontSize: 11 }} />
                <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} tickFormatter={v => (v / 1000) + 'k'} />
                <Tooltip
                  contentStyle={{ background: '#1a1a28', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  formatter={v => [formatCurrency(v), 'Doanh thu']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#e94560" strokeWidth={2} dot={{ fill: '#e94560', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-center" style={{ height: 220, color: 'var(--text-muted)' }}>Chưa có dữ liệu</div>
          )}
        </div>

        {/* Top movies */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 16 }}>🏆 Phim bán chạy</div>
          {stats?.top_movies?.length > 0 ? stats.top_movies.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
              <div style={{ width: 24, height: 24, background: i === 0 ? '#f5c518' : 'var(--bg-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, color: i === 0 ? '#000' : 'var(--text-secondary)' }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{m.bookings} vé • {formatCurrency(m.revenue)}</div>
              </div>
            </div>
          )) : <div className="text-muted text-sm">Chưa có dữ liệu</div>}
        </div>
      </div>

      {/* Recent bookings */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700 }}>🎟️ Đơn đặt vé gần đây</div>
          <Link to="/admin/bookings" className="btn btn-ghost btn-sm">Xem tất cả →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Khách hàng</th><th>Phim</th><th>Số tiền</th><th>Trạng thái</th><th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_bookings?.map(b => {
                const [cls, label] = statusMap[b.status] || ['badge-muted', b.status];
                return (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--text-secondary)' }}>#{b.id}</td>
                    <td style={{ fontWeight: 500 }}>{b.full_name}</td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.movie_title}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatCurrency(b.total_amount)}</td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{new Date(b.booking_time).toLocaleString('vi-VN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
