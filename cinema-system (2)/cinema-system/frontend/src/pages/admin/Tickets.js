import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { ticketAPI, roomAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
 
// Badge màu theo trạng thái vé
const statusBadge = {
  valid:     { label: 'Chưa dùng', cls: 'badge badge-success' },
  used:      { label: 'Đã dùng',   cls: 'badge badge-muted'   },
  cancelled: { label: 'Đã hủy',    cls: 'badge badge-error'   },
};
 
const AdminTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [verifying, setVerifying] = useState(null);
  const searchRef = useRef(null);
 
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterRoom) params.room_id = filterRoom;
      const res = await ticketAPI.getToday(params);
      setTickets(res.data.data || []);
    } catch {
      toast.error('Không thể tải danh sách vé');
    } finally {
      setLoading(false);
    }
  };
 
  const fetchRooms = async () => {
    try {
      const res = await roomAPI.getAll({ status: 'active' });
      setRooms(res.data.data || []);
    } catch {}
  };
 
  useEffect(() => {
    fetchRooms();
  }, []);
 
  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterRoom]); // eslint-disable-line
 
  // Tìm kiếm theo tên / booking id / ghế
  const filtered = tickets.filter(t => {
    if (!searchInput) return true;
    const q = searchInput.toLowerCase();
    return (
      t.full_name?.toLowerCase().includes(q) ||
      String(t.booking_id).includes(q) ||
      t.seats?.toLowerCase().includes(q) ||
      t.phone?.includes(q)
    );
  });
 
  const handleVerify = async (ticket) => {
    if (ticket.status !== 'valid') {
      toast.warning(ticket.status === 'used' ? 'Vé đã được sử dụng rồi' : 'Vé đã bị hủy');
      return;
    }
    if (!window.confirm(`Xác nhận vé của ${ticket.full_name}?\nPhim: ${ticket.movie_title} | Ghế: ${ticket.seats}`)) return;
 
    setVerifying(ticket.id);
    try {
      await ticketAPI.verify(ticket.id);
      toast.success(`✅ Xác minh thành công — ${ticket.full_name}`);
      // Cập nhật local state, không cần fetch lại
      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'used' } : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Xác minh thất bại');
    } finally {
      setVerifying(null);
    }
  };
 
  // Thống kê nhanh
  const stats = {
    total: tickets.length,
    valid: tickets.filter(t => t.status === 'valid').length,
    used:  tickets.filter(t => t.status === 'used').length,
  };
 
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Kiểm Vé Hôm Nay</div>
          <div className="page-subtitle">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <button onClick={fetchTickets} className="btn btn-secondary" style={{ gap: 6 }}>
          🔄 Làm mới
        </button>
      </div>
 
      {/* Stat cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(233,69,96,0.1)' }}>🎟️</div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Tổng vé hôm nay</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(0,212,170,0.1)' }}>⏳</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.valid}</div>
            <div className="stat-label">Chưa check-in</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(136,136,170,0.1)' }}>✅</div>
          <div>
            <div className="stat-value" style={{ color: 'var(--text-secondary)' }}>{stats.used}</div>
            <div className="stat-label">Đã check-in</div>
          </div>
        </div>
      </div>
 
      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Tìm kiếm */}
          <div className="form-group" style={{ flex: 2, minWidth: 200, marginBottom: 0 }}>
            <label className="form-label">Tìm kiếm</label>
            <input
              ref={searchRef}
              className="form-input"
              placeholder="Tên khách, số booking, ghế, SĐT..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
 
          {/* Filter phòng */}
          <div className="form-group" style={{ flex: 1, minWidth: 150, marginBottom: 0 }}>
            <label className="form-label">Phòng chiếu</label>
            <select
              className="form-select"
              value={filterRoom}
              onChange={e => setFilterRoom(e.target.value)}
            >
              <option value="">Tất cả phòng</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
 
          {/* Filter trạng thái */}
          <div className="form-group" style={{ flex: 1, minWidth: 140, marginBottom: 0 }}>
            <label className="form-label">Trạng thái</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="valid">Chưa dùng</option>
              <option value="used">Đã dùng</option>
            </select>
          </div>
 
          {/* Clear */}
          {(searchInput || filterRoom || filterStatus) && (
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: 0 }}
              onClick={() => { setSearchInput(''); setFilterRoom(''); setFilterStatus(''); }}
            >
              ✕ Xóa bộ lọc
            </button>
          )}
        </div>
      </div>
 
      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>Đang tải...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🎟️</div>
            <div>Không có vé nào hôm nay</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Khách hàng</th>
                  <th>Phim</th>
                  <th>Suất chiếu</th>
                  <th>Ghế</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ticket => {
                  const badge = statusBadge[ticket.status] || statusBadge.valid;
                  const isVerifying = verifying === ticket.id;
                  return (
                    <tr key={ticket.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                        #{ticket.booking_id}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{ticket.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ticket.phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{ticket.movie_title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ticket.room_name}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 14 }}>
                          {new Date(ticket.show_date).toLocaleDateString('vi-VN')}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                          {ticket.start_time?.slice(0, 5)}
                        </div>
                      </td>
                      <td>
                        <div style={{
                          background: 'var(--bg-hover)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 13,
                          fontWeight: 600,
                          display: 'inline-block',
                        }}>
                          {ticket.seats}
                        </div>
                      </td>
                      <td>
                        <span className={badge.cls}>{badge.label}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {ticket.status === 'valid' ? (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleVerify(ticket)}
                            disabled={isVerifying}
                            style={{ minWidth: 90 }}
                          >
                            {isVerifying ? '...' : '✅ Check-in'}
                          </button>
                        ) : ticket.status === 'used' ? (
                          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            Đã check-in
                          </span>
                        ) : (
                          <span style={{ fontSize: 13, color: 'var(--error)' }}>Đã hủy</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
 
      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)', textAlign: 'right' }}>
          Hiển thị {filtered.length} / {tickets.length} vé
        </div>
      )}
    </div>
  );
};
 
export default AdminTickets;