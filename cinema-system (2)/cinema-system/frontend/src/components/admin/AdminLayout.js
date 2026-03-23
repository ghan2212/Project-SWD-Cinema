import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
 
// ── Menu theo role ─────────────────────────────────────────────────────────────
const menuItems = [
  {
    path: '/admin',
    label: 'Dashboard',
    icon: '📊',
    roles: ['admin', 'manager'],
    exact: true,   // chỉ active khi đúng /admin, không phải /admin/xxx
  },
  {
    path: '/admin/movies',
    label: 'Phim',
    icon: '🎬',
    roles: [ 'manager'],
  },
  {
    path: '/admin/showtimes',
    label: 'Lịch chiếu',
    icon: '🕐',
    roles: [ 'manager'],
  },
  {
    path: '/admin/rooms',
    label: 'Phòng chiếu',
    icon: '🏠',
    roles: [ 'manager'],
  },
  {
    path: '/admin/bookings',
    label: 'Đặt vé',
    icon: '🎟️',
    roles: [ 'manager', 'ticket_staff'],
  },
  // {
  //   path: '/admin/tickets',
  //   label: 'Kiểm vé',       // ← ticket_staff dùng chính để verify vé
  //   icon: '✅',
  //   roles: [ 'manager', 'ticket_staff'],
  // },
  {
    path: '/admin/ticket-scanner',
    label: 'Soát vé QR',
    icon: '📷',
    roles: ['admin', 'manager', 'ticket_staff'],
  },
  {
    path: '/admin/payments',
    label: 'Thanh toán',
    icon: '💳',
    roles: [ 'manager', 'ticket_staff'],
  },
  {
    path: '/admin/users',
    label: 'Người dùng',
    icon: '👥',
    roles: ['admin'],
  },
];
 
// ── Màu badge theo role ────────────────────────────────────────────────────────
const ROLE_STYLE = {
  admin:        { bg: 'rgba(139,92,246,0.2)',  border: 'rgba(139,92,246,0.4)',  color: '#c4b5fd', icon: '👑', label: 'Admin' },
  manager:      { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.35)', color: '#6ee7b7', icon: '🏢', label: 'Manager' },
  ticket_staff: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#fcd34d', icon: '🎟️', label: 'Ticket Staff' },
  customer:     { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.35)', color: '#93c5fd', icon: '👤', label: 'Customer' },
};
 
const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
 
  const roleStyle = ROLE_STYLE[user?.role_name] || ROLE_STYLE.customer;
 
  // Lọc menu theo role hiện tại
  const visibleMenu = menuItems.filter(item => item.roles.includes(user?.role_name));
 
  const isActive = (item) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path);
 
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
 
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
 
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 64 : 240,
        flexShrink: 0,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}>
 
        {/* Logo */}
        <div style={{
          padding: '18px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, flexShrink: 0,
          }}>🎬</div>
          {!collapsed && (
            <span style={{
              fontFamily: 'Bebas Neue',
              fontSize: 18,
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              color: 'var(--text-primary)',
            }}>
              CINEMAX
            </span>
          )}
        </div>
 
        {/* Role badge */}
        {!collapsed && (
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: roleStyle.bg,
              border: `1px solid ${roleStyle.border}`,
              color: roleStyle.color,
              borderRadius: 20,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}>
              <span style={{ fontSize: 13 }}>{roleStyle.icon}</span>
              {roleStyle.label}
            </div>
            <div style={{
              marginTop: 5,
              fontSize: 13,
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.full_name}
            </div>
            <div style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </div>
          </div>
        )}
 
        {/* Nav items */}
        <nav style={{
          flex: 1,
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
        }}>
          {visibleMenu.map(item => {
            const active = isActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px' : '10px 12px',
                  borderRadius: 8,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                  fontSize: 14,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 17, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
 
        {/* Bottom actions */}
        <div style={{
          padding: '10px 8px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flexShrink: 0,
        }}>
          <Link
            to="/"
            title={collapsed ? 'Trang chủ' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '10px' : '10px 12px',
              borderRadius: 8,
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'var(--text-secondary)',
              fontSize: 14,
              textDecoration: 'none',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 17 }}>🌐</span>
            {!collapsed && 'Trang chủ'}
          </Link>
 
          <button
            onClick={handleLogout}
            title={collapsed ? 'Đăng xuất' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '10px' : '10px 12px',
              borderRadius: 8,
              justifyContent: collapsed ? 'center' : 'flex-start',
              color: 'var(--error)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              width: '100%',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 17 }}>🚪</span>
            {!collapsed && 'Đăng xuất'}
          </button>
 
          {/* Toggle collapse */}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px',
              borderRadius: 8,
              background: 'var(--bg-hover)',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              width: '100%',
              fontSize: 14,
              transition: 'all 0.15s',
            }}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </aside>
 
      {/* ── Main area ───────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
 
        {/* Topbar */}
        <header style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          padding: '0 24px',
          height: 58,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          flexShrink: 0,
        }}>
          {/* Breadcrumb — tên trang hiện tại */}
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {visibleMenu.find(m => isActive(m))?.label || 'Dashboard'}
          </div>
 
          {/* User info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '6px 12px',
          }}>
            <div style={{
              width: 28, height: 28,
              background: 'var(--accent)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{user?.full_name}</div>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: roleStyle.color,
                background: roleStyle.bg,
                borderRadius: 4,
                padding: '1px 5px',
                display: 'inline-block',
                marginTop: 1,
              }}>
                {roleStyle.icon} {roleStyle.label}
              </div>
            </div>
          </div>
        </header>
 
        {/* Page content */}
        <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
 
export default AdminLayout;