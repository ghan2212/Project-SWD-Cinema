import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
 
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
 
  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
 
  // Đóng menu khi chuyển trang
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
 
  const handleLogout = () => {
    logout();
    navigate('/');
  };
 
  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
 
  // Chỉ customer mới thấy nav phía user; staff/admin có AdminLayout riêng
  const isStaff = user && ['admin', 'manager', 'ticket_staff'].includes(user.role_name);
 
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, background: 'var(--accent)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>🎬</div>
          <span style={{ fontFamily: 'Bebas Neue', fontSize: 24, letterSpacing: '0.1em', color: 'var(--text-primary)' }}>
            CINEMAX
          </span>
        </Link>
 
        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[['/', 'Trang Chủ'], ['/movies', 'Phim']].map(([path, label]) => (
            <Link key={path} to={path} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: isActive(path) ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive(path) ? 'var(--accent-dim)' : 'transparent',
              transition: 'all 0.2s', textDecoration: 'none',
            }}>{label}</Link>
          ))}
 
          {/* Lịch sử chỉ hiện với customer đã đăng nhập */}
          {user && !isStaff && (
            <Link to="/my-bookings" style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              color: isActive('/my-bookings') ? 'var(--accent)' : 'var(--text-secondary)',
              background: isActive('/my-bookings') ? 'var(--accent-dim)' : 'transparent',
              textDecoration: 'none',
            }}>Vé của tôi</Link>
          )}
 
          {/* Nút quản lý cho staff */}
          {isStaff && (
            <Link to="/admin" style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
              color: 'var(--accent)', background: 'var(--accent-dim)',
              textDecoration: 'none',
            }}>⚡ Quản lý</Link>
          )}
        </div>
 
        {/* Auth section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user ? (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '8px 14px', cursor: 'pointer', color: 'var(--text-primary)',
                }}
              >
                <div style={{
                  width: 28, height: 28, background: 'var(--accent)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 13, fontWeight: 700,
                }}>
                  {user.full_name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{user.full_name?.split(' ').pop()}</span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{menuOpen ? '▲' : '▼'}</span>
              </button>
 
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 10, minWidth: 200, overflow: 'hidden',
                  boxShadow: 'var(--shadow)', zIndex: 200,
                }}>
                  {/* Info header */}
                  <div style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user.full_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{user.email}</div>
                  </div>
 
                  <Link to="/profile" style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 16px', fontSize: 14, color: 'var(--text-primary)',
                    borderBottom: '1px solid var(--border)', textDecoration: 'none',
                  }}>👤 Hồ sơ cá nhân</Link>
 
                  {!isStaff && (
                    <Link to="/my-bookings" style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '11px 16px', fontSize: 14, color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border)', textDecoration: 'none',
                    }}>🎟️ Vé của tôi</Link>
                  )}
 
                  {isStaff && (
                    <Link to="/admin" style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '11px 16px', fontSize: 14, color: 'var(--accent)',
                      borderBottom: '1px solid var(--border)', textDecoration: 'none',
                    }}>⚡ Trang quản lý</Link>
                  )}
 
                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', textAlign: 'left',
                      padding: '11px 16px', fontSize: 14, color: 'var(--error)',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                  >🚪 Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
 
const Footer = () => (
  <footer style={{
    background: 'var(--bg-secondary)',
    borderTop: '1px solid var(--border)',
    padding: '40px 24px',
    marginTop: 80,
  }}>
    <div style={{
      maxWidth: 1280, margin: '0 auto',
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32,
    }}>
      <div>
        <div style={{ fontFamily: 'Bebas Neue', fontSize: 24, marginBottom: 8 }}>🎬 CINEMAX</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Hệ thống đặt vé xem phim trực tuyến hiện đại nhất.
        </p>
      </div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Khám phá</div>
        {[
          ['/', 'Trang chủ'],
          ['/movies?status=now_showing', 'Phim đang chiếu'],
          ['/movies?status=coming_soon', 'Phim sắp chiếu'],
        ].map(([href, label]) => (
          <Link key={href} to={href} style={{
            display: 'block', color: 'var(--text-secondary)',
            fontSize: 14, marginBottom: 8, textDecoration: 'none',
          }}>{label}</Link>
        ))}
      </div>
      <div>
        <div style={{ fontWeight: 600, marginBottom: 12 }}>Liên hệ</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8 }}>
          📍 123 Đường Phim, TP.HCM<br />
          📞 1900 xxxx<br />
          ✉️ info@cinemax.vn
        </p>
      </div>
    </div>
    <div style={{
      maxWidth: 1280, margin: '32px auto 0', paddingTop: 24,
      borderTop: '1px solid var(--border)',
      textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
    }}>
      © 2024 Cinemax. All rights reserved.
    </div>
  </footer>
);
 
const Layout = ({ children }) => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <Navbar />
    <main style={{ flex: 1 }}>{children}</main>
    <Footer />
  </div>
);
 
export default Layout;