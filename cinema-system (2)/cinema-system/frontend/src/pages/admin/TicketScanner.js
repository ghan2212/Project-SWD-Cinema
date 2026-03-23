import { useState, useRef, useEffect } from "react";
 
// ══════════════════════════════════════════
// CONFIG — chỉnh địa chỉ backend ở đây
// ══════════════════════════════════════════
const API_BASE = "http://localhost:5000";
 
// Tự lấy token từ localStorage (do AuthContext lưu sau login)
const getToken = () => localStorage.getItem("cinema_token") || "";
 
// ══════════════════════════════════════════
// PALETTE
// ══════════════════════════════════════════
const C = {
  bg: "#0a0c10", surface: "#12151c", card: "#181d27", border: "#1e2535",
  gold: "#f5c518", goldDim: "#c9a214",
  green: "#22c55e", greenDim: "#0f3320",
  red: "#ef4444", redDim: "#3b0f0f",
  orange: "#f97316",
  text: "#e8eaf0", muted: "#6b7280",
};
 
// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
const fmt      = (t) => t ? String(t).slice(0, 5) : "--:--";
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }) : "---";
const fmtMoney = (n) => n ? Number(n).toLocaleString("vi-VN") + "đ" : "---";
const nowStr   = () => new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
 
// ══════════════════════════════════════════
// API — gọi backend theo booking_id
// ══════════════════════════════════════════
async function apiVerify(bookingId) {
  const id    = bookingId.trim();
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
 
  // Bước 1: lấy thông tin vé theo booking_id
  const getRes  = await fetch(`${API_BASE}/api/tickets/booking/${encodeURIComponent(id)}`, { headers });
  const getData = await getRes.json().catch(() => ({}));
 
  if (!getRes.ok || !getData.success) {
    return { success: false, message: getData.message || `Không tìm thấy vé với Booking #${id}.`, ticket: null };
  }
 
  const ticket = getData.data;
 
  if (ticket.status === "used")      return { success: false, message: "Vé này đã được sử dụng rồi.", ticket };
  if (ticket.status === "cancelled") return { success: false, message: "Vé này đã bị hủy.", ticket };
 
  // Bước 2: xác minh (PUT verify theo ticket.id)
  const putRes  = await fetch(`${API_BASE}/api/tickets/verify/${encodeURIComponent(ticket.id)}`, { method: "PUT", headers });
  const putData = await putRes.json().catch(() => ({}));
 
  if (!putRes.ok || !putData.success) {
    return { success: false, message: putData.message || "Không thể xác minh vé.", ticket };
  }
 
  return { success: true, message: "Vé hợp lệ — xác minh thành công!", ticket };
}
 
// ══════════════════════════════════════════
// QR TRANG TRÍ
// ══════════════════════════════════════════
function QRDecor() {
  return (
    <svg width="100" height="100" viewBox="0 0 96 96" fill="none">
      <rect x="6"  y="6"  width="34" height="34" rx="4" stroke={C.gold} strokeWidth="2.5" fill="none"/>
      <rect x="14" y="14" width="18" height="18" rx="2" fill={C.gold} opacity="0.15"/>
      <rect x="18" y="18" width="10" height="10" rx="1.5" fill={C.gold} opacity="0.6"/>
      <rect x="56" y="6"  width="34" height="34" rx="4" stroke={C.gold} strokeWidth="2.5" fill="none"/>
      <rect x="64" y="14" width="18" height="18" rx="2" fill={C.gold} opacity="0.15"/>
      <rect x="68" y="18" width="10" height="10" rx="1.5" fill={C.gold} opacity="0.6"/>
      <rect x="6"  y="56" width="34" height="34" rx="4" stroke={C.gold} strokeWidth="2.5" fill="none"/>
      <rect x="14" y="64" width="18" height="18" rx="2" fill={C.gold} opacity="0.15"/>
      <rect x="18" y="68" width="10" height="10" rx="1.5" fill={C.gold} opacity="0.6"/>
      <rect x="56" y="56" width="10" height="10" rx="2" fill={C.gold} opacity="0.45"/>
      <rect x="70" y="56" width="10" height="10" rx="2" fill={C.gold} opacity="0.45"/>
      <rect x="84" y="56" width="6"  height="6"  rx="1" fill={C.gold} opacity="0.25"/>
      <rect x="56" y="70" width="10" height="10" rx="2" fill={C.gold} opacity="0.45"/>
      <rect x="70" y="70" width="6"  height="6"  rx="1" fill={C.gold} opacity="0.25"/>
      <rect x="80" y="70" width="10" height="10" rx="2" fill={C.gold} opacity="0.45"/>
      <rect x="56" y="84" width="6"  height="6"  rx="1" fill={C.gold} opacity="0.25"/>
      <rect x="66" y="82" width="10" height="10" rx="2" fill={C.gold} opacity="0.45"/>
      <rect x="80" y="84" width="10" height="6"  rx="1" fill={C.gold} opacity="0.45"/>
    </svg>
  );
}
 
// ══════════════════════════════════════════
// STATUS BADGE
// ══════════════════════════════════════════
function StatusBadge({ status }) {
  const map = {
    valid:     { label: "Hợp lệ",  bg: C.greenDim, color: C.green  },
    used:      { label: "Đã dùng", bg: C.redDim,   color: C.red    },
    cancelled: { label: "Đã hủy",  bg: C.redDim,   color: C.orange },
  };
  const s = map[status] || map.valid;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
      {s.label}
    </span>
  );
}
 
// ══════════════════════════════════════════
// INFO ROW
// ══════════════════════════════════════════
function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ color: C.muted, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
      <div style={{ color: C.text, fontWeight: 600, fontSize: 13 }}>{value || "—"}</div>
    </div>
  );
}
 
// ══════════════════════════════════════════
// RESULT CARD
// ══════════════════════════════════════════
function ResultCard({ result, ticket, code, onReset }) {
  const ok = result.success;
  return (
    <div style={{ animation: "fadeUp .3s ease" }}>
      <div style={{
        background: C.card,
        border: `1px solid ${ok ? C.green : C.red}`,
        borderRadius: 16, overflow: "hidden",
        boxShadow: `0 0 40px ${ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`,
      }}>
        {/* Header */}
        <div style={{
          background: ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
          padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: `1px solid ${ok ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
        }}>
          <span style={{ fontSize: 24 }}>{ok ? "✅" : "❌"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ color: ok ? C.green : C.red, fontWeight: 800, fontSize: 14, letterSpacing: "0.04em" }}>
              {ok ? "XÁC MINH THÀNH CÔNG" : "XÁC MINH THẤT BẠI"}
            </div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{result.message}</div>
          </div>
          {ticket && <StatusBadge status={ok ? "used" : ticket.status} />}
        </div>
 
        {/* Body */}
        {ticket ? (
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Avatar + tên */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldDim})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 19, fontWeight: 900, color: C.bg,
              }}>
                {ticket.full_name?.charAt(0) || "?"}
              </div>
              <div>
                <div style={{ color: C.text, fontWeight: 700, fontSize: 16 }}>{ticket.full_name}</div>
                <div style={{ color: C.muted, fontSize: 12 }}>{ticket.phone || ticket.email || "—"}</div>
              </div>
            </div>
 
            <div style={{ height: 1, background: C.border }} />
 
            {/* Grid thông tin */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <InfoRow label="Phim" value={ticket.movie_title} />
              </div>
              <InfoRow label="Phòng chiếu" value={ticket.room_name} />
              <InfoRow label="Suất chiếu"  value={fmt(ticket.start_time)} />
              <InfoRow label="Ngày chiếu"  value={fmtDate(ticket.show_date)} />
              <InfoRow label="Ghế"         value={ticket.seats} />
              <div style={{ gridColumn: "1 / -1" }}>
                <InfoRow label="Tổng tiền" value={fmtMoney(ticket.total_amount)} />
              </div>
            </div>
 
            <div style={{ height: 1, background: C.border }} />
 
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: C.muted, fontSize: 11 }}>
                Booking ID: <span style={{ color: C.text, fontWeight: 700 }}>#{code}</span> · Vé #{ticket.id}
              </span>
              <span style={{ color: C.muted, fontSize: 11 }}>{nowStr()}</span>
            </div>
          </div>
        ) : (
          <div style={{ padding: "24px 18px", textAlign: "center" }}>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>
              Booking ID đã nhập: <span style={{ color: C.text, fontWeight: 700 }}>#{code}</span>
            </div>
          </div>
        )}
      </div>
 
      <button onClick={onReset} style={{
        width: "100%", marginTop: 14, padding: 14,
        background: C.gold, color: C.bg, border: "none",
        borderRadius: 12, fontWeight: 800, fontSize: 15,
        cursor: "pointer", letterSpacing: "0.04em",
      }}>
        ↩ QUÉT VÉ TIẾP THEO
      </button>
    </div>
  );
}
 
// ══════════════════════════════════════════
// HISTORY ROW
// ══════════════════════════════════════════
function HistoryRow({ entry }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 12px", borderRadius: 8,
      background: C.surface, border: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 14 }}>{entry.success ? "✅" : "❌"}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.text, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Booking #{entry.code}
        </div>
        <div style={{ color: C.muted, fontSize: 11 }}>{entry.label}</div>
      </div>
      <div style={{ color: C.muted, fontSize: 11, flexShrink: 0 }}>{entry.time}</div>
    </div>
  );
}
 
// ══════════════════════════════════════════
// TEST CONNECTION
// ══════════════════════════════════════════
function TestConnection() {
  const [status, setStatus] = useState(null);
  const [msg, setMsg]       = useState("");
 
  const test = async () => {
    setStatus("testing"); setMsg("");
    try {
      const token = getToken();
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/tickets/booking/1`, { headers });
      if (res.ok) { setStatus("ok");   setMsg("Kết nối thành công!"); }
      else         { setStatus("fail"); setMsg(`Server trả về HTTP ${res.status}`); }
    } catch (e) {
      setStatus("fail");
      setMsg(`Không kết nối được: ${e.message}`);
    }
  };
 
  return (
    <div>
      <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
        Kiểm tra kết nối
      </div>
      <button onClick={test} disabled={status === "testing"} style={{
        padding: "9px 16px", background: C.surface,
        border: `1px solid ${C.border}`, borderRadius: 8,
        color: C.text, fontWeight: 600, fontSize: 13, cursor: "pointer",
      }}>
        {status === "testing" ? "⏳ Đang kiểm tra..." : "🔌 Test kết nối backend"}
      </button>
      {status && status !== "testing" && (
        <div style={{
          marginTop: 8, padding: "8px 12px", borderRadius: 8,
          background: status === "ok" ? C.greenDim : C.redDim,
          color: status === "ok" ? C.green : C.red,
          fontSize: 12, fontWeight: 600,
        }}>
          {status === "ok" ? "✅ " : "❌ "}{msg}
        </div>
      )}
    </div>
  );
}
 
// ══════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════
export default function TicketScanner() {
  const [code, setCode]             = useState("");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [tab, setTab]               = useState("scan");
  const [history, setHistory]       = useState([]);
  const [stats, setStats]           = useState({ ok: 0, fail: 0 });
  const inputRef = useRef(null);
 
  useEffect(() => {
    if (tab === "scan" && !result) inputRef.current?.focus();
  }, [tab, result]);
 
  const handleScan = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await apiVerify(code.trim());
      setResult(res);
      setHistory(prev => [{
        code: code.trim(),
        success: res.success,
        label: res.success ? (res.ticket?.full_name + ' · ' + res.ticket?.movie_title) : res.message,
        time: nowStr(),
      }, ...prev].slice(0, 50));
      setStats(prev => res.success ? { ...prev, ok: prev.ok + 1 } : { ...prev, fail: prev.fail + 1 });
    } catch (e) {
      const res = { success: false, message: `Lỗi kết nối: ${e.message}`, ticket: null };
      setResult(res);
      setHistory(prev => [{ code: code.trim(), success: false, label: res.message, time: nowStr() }, ...prev].slice(0, 50));
      setStats(prev => ({ ...prev, fail: prev.fail + 1 }));
    }
    setLoading(false);
  };
 
  const handleReset = () => {
    setResult(null);
    setCode("");
    setTimeout(() => inputRef.current?.focus(), 60);
  };
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes spin   { to { transform:rotate(360deg) } }
        @keyframes scanBar { 0%{top:12px;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:calc(100% - 14px);opacity:0} }
        input::placeholder, textarea::placeholder { color:${C.muted}; }
        input:focus, textarea:focus { outline:none; }
        button { font-family:inherit; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:2px; }
      `}</style>
 
      <div style={{
        fontFamily: "'DM Sans', sans-serif",
        background: C.bg, minHeight: "100vh",
        maxWidth: 480, margin: "0 auto",
        display: "flex", flexDirection: "column",
      }}>
 
        {/* HEADER */}
        <div style={{
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue'", fontSize: 26, color: C.gold, letterSpacing: "0.08em", lineHeight: 1 }}>
              🎬 CINÉ CHECK
            </div>
            <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>
              Cổng soát vé ·{" "}
              <span style={{ color: getToken() ? C.green : C.orange }}>
                {getToken() ? "✓ Đã xác thực" : "⚠ Chưa đăng nhập"}
              </span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: C.muted, fontSize: 10, marginBottom: 4 }}>CA HÔM NAY</div>
            <div style={{ display: "flex", gap: 10 }}>
              <span style={{ color: C.green, fontWeight: 700, fontSize: 15 }}>✓ {stats.ok}</span>
              <span style={{ color: C.red,   fontWeight: 700, fontSize: 15 }}>✗ {stats.fail}</span>
            </div>
          </div>
        </div>
 
        {/* TABS */}
        <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
          {[
            { id: "scan",     label: "🎫 Soát vé"  },
            { id: "history",  label: "📋 Lịch sử"  },
            { id: "settings", label: "⚙️ Cài đặt"  },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "11px 0", border: "none", cursor: "pointer",
              background: "transparent",
              color: tab === t.id ? C.gold : C.muted,
              fontWeight: tab === t.id ? 700 : 500, fontSize: 13,
              borderBottom: tab === t.id ? `2px solid ${C.gold}` : "2px solid transparent",
              transition: "all .18s",
            }}>{t.label}</button>
          ))}
        </div>
 
        {/* ── TAB: SOÁT VÉ ── */}
        {tab === "scan" && (
          <div style={{ flex: 1, padding: "20px 20px 36px", display: "flex", flexDirection: "column", gap: 18 }}>
            {!result && (
              <>
                {/* QR  */}
                <div style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: 16, padding: "28px 20px 20px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Scan  */}
                  <div style={{
                    position: "absolute", left: 40, right: 40, height: 2,
                    background: `linear-gradient(90deg, transparent, ${C.gold}bb, transparent)`,
                    borderRadius: 1,
                    animation: "scanBar 2.2s ease-in-out infinite",
                    pointerEvents: "none",
                  }} />
                  {/* Góc khung */}
                  {[
                    { top:12, left:12,  borderTop:`2px solid ${C.gold}55`,    borderLeft:`2px solid ${C.gold}55`   },
                    { top:12, right:12, borderTop:`2px solid ${C.gold}55`,    borderRight:`2px solid ${C.gold}55`  },
                    { bottom:12,left:12,borderBottom:`2px solid ${C.gold}55`, borderLeft:`2px solid ${C.gold}55`   },
                    { bottom:12,right:12,borderBottom:`2px solid ${C.gold}55`,borderRight:`2px solid ${C.gold}55`  },
                  ].map((s,i) => <div key={i} style={{ position:"absolute", width:20, height:20, ...s }} />)}
 
                  <QRDecor />
                  <div style={{ color: C.muted, fontSize: 12, textAlign: "center" }}>
                    Nhập mã Booking ID bên dưới để xác minh
                  </div>
                </div>
 
                {/* Input mã vé */}
                <div>
                  <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                    Nhập mã Booking ID
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      ref={inputRef}
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      type="number" min="1" onKeyDown={e => e.key === "Enter" && handleScan()}
                      placeholder="VD: 23, 48, 53 ..."
                      disabled={loading}
                      style={{
                        flex: 1, padding: "13px 14px",
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 10, color: C.text,
                        fontSize: 16, fontWeight: 700, letterSpacing: "0.04em",
                        transition: "border .15s",
                      }}
                      onFocus={e => e.target.style.border = `1px solid ${C.gold}`}
                      onBlur={e  => e.target.style.border = `1px solid ${C.border}`}
                    />
                    <button
                      onClick={handleScan}
                      disabled={loading || !code.trim()}
                      style={{
                        padding: "13px 18px", minWidth: 94,
                        background: loading || !code.trim() ? C.border : C.gold,
                        color:      loading || !code.trim() ? C.muted  : C.bg,
                        border: "none", borderRadius: 10,
                        fontWeight: 800, fontSize: 13,
                        cursor: loading || !code.trim() ? "not-allowed" : "pointer",
                        transition: "all .18s",
                      }}
                    >
                      {loading
                        ? <span style={{ display:"inline-block", width:16, height:16, border:`2px solid ${C.muted}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin .7s linear infinite" }} />
                        : "XÁC MINH"}
                    </button>
                  </div>
                  {loading && (
                    <div style={{ marginTop: 10, color: C.muted, fontSize: 12, animation: "pulse 1s infinite", textAlign: "center" }}>
                      ⏳ Đang tra cứu Booking tới {API_BASE}...
                    </div>
                  )}
                </div>
              </>
            )}
 
            {result && (
              <ResultCard result={result} ticket={result.ticket} code={code} onReset={handleReset} />
            )}
          </div>
        )}
 
        {/*  LỊCH SỬ ── */}
        {tab === "history" && (
          <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {history.length} lượt xác minh
              </span>
              {history.length > 0 && (
                <button onClick={() => { setHistory([]); setStats({ ok:0, fail:0 }); }} style={{
                  background: "transparent", border: `1px solid ${C.border}`,
                  color: C.muted, padding: "4px 10px", borderRadius: 6,
                  fontSize: 11, cursor: "pointer",
                }}>Xóa tất cả</button>
              )}
            </div>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                Chưa có lượt soát nào trong ca này
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {history.map((e, i) => <HistoryRow key={i} entry={e} />)}
              </div>
            )}
          </div>
        )}
 
        {/* CÀI ĐẶT ── */}
        {tab === "settings" && (
          <div style={{ flex: 1, padding: "20px", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>Cài đặt kết nối</div>
 
            <div>
              <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>API Base URL</div>
              <div style={{ padding: "11px 14px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, color: C.gold, fontSize: 13, fontFamily: "monospace" }}>
                {API_BASE}
              </div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
                Sửa trong file <code style={{ color: C.text }}>TicketScanner.jsx</code> dòng đầu
              </div>
            </div>
 
            <div>
              <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>JWT Token</div>
              <div style={{
                padding: "11px 14px", background: C.surface,
                border: `1px solid ${token ? C.green : C.border}`, borderRadius: 8,
                color: token ? C.green : C.muted, fontSize: 12, fontFamily: "monospace", wordBreak: "break-all",
              }}>
                {token ? token.slice(0, 48) + "…" : "Chưa có token"}
              </div>
              <button onClick={() => setShowTokenModal(true)} style={{
                marginTop: 8, padding: "9px 16px",
                background: "transparent", border: `1px solid ${C.gold}`,
                borderRadius: 8, color: C.gold,
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>✏️ Cập nhật token</button>
            </div>
 
            <TestConnection />
          </div>
        )}
 
        {/* FOOTER */}
        <div style={{ padding: "10px 20px", textAlign: "center", borderTop: `1px solid ${C.border}`, color: C.muted, fontSize: 10 }}>
          {new Date().toLocaleDateString("vi-VN", { weekday:"long", day:"2-digit", month:"2-digit", year:"numeric" })} · CinéSystem v2.1
        </div>
      </div>
    </>
  );
}