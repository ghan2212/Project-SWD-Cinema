import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../../services/api';

const formatCurrency = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    paymentAPI.getAll().then(r => setPayments(r.data.data)).finally(() => setLoading(false));
  }, []);

  const filtered = payments.filter(p =>
    !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.transaction_code?.toLowerCase().includes(search.toLowerCase()) ||
    p.movie_title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = payments.filter(p => p.status === 'success').reduce((s, p) => s + parseFloat(p.amount), 0);

  const methodIcon = { vnpay: '💳', cash: '💵', card: '🏦' };
  const statusMap = { success: ['badge-success', 'Thành công'], pending: ['badge-warning', 'Đang xử lý'], failed: ['badge-error', 'Thất bại'], refunded: ['badge-muted', 'Hoàn tiền'] };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">THANH TOÁN</div>
          <div className="page-subtitle">Tổng doanh thu: <span style={{ color: 'var(--accent)' }}>{formatCurrency(totalRevenue)}</span></div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Tổng giao dịch', value: payments.length, icon: '📊' },
          { label: 'Thành công', value: payments.filter(p => p.status === 'success').length, icon: '✅' },
          { label: 'VNPay', value: payments.filter(p => p.method === 'vnpay').length, icon: '💳' },
          { label: 'Tiền mặt', value: payments.filter(p => p.method === 'cash').length, icon: '💵' },
        ].map((c, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-dim)', fontSize: 22 }}>{c.icon}</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent)', fontSize: 28 }}>{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <input className="form-input" placeholder="🔍 Tìm theo tên, mã GD, phim..." value={search}
          onChange={e => setSearch(e.target.value)} style={{ maxWidth: 320 }} />
      </div>

      <div className="card">
        {loading ? <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Mã GD</th><th>Khách hàng</th><th>Phim</th><th>Số tiền</th><th>PT Thanh toán</th><th>Trạng thái</th><th>Thời gian</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const [cls, label] = statusMap[p.status] || ['badge-muted', p.status];
                  return (
                    <tr key={p.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                          {p.transaction_code?.slice(0, 16)}...
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.email}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        <div>{p.movie_title}</div>
                        <div style={{ fontSize: 11 }}>{new Date(p.show_date).toLocaleDateString('vi-VN')} {p.start_time?.slice(0,5)}</div>
                      </td>
                      <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{formatCurrency(p.amount)}</td>
                      <td>
                        <span>{methodIcon[p.method] || '💳'} {p.method?.toUpperCase()}</span>
                      </td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {p.paid_at ? new Date(p.paid_at).toLocaleString('vi-VN') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="flex-center" style={{ height: 120, color: 'var(--text-muted)' }}>Không có dữ liệu</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayments;
