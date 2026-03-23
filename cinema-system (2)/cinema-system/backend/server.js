require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
 
const app = express();
 
// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 
 
const db = require('./config/database');
 
async function testDB() {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log("✅ MySQL connected:", rows);
  } catch (err) {
    console.error("❌ MySQL connection failed:", err);
  }
}
 
testDB();
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/showtimes', require('./routes/showtimes'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/seats', require('./routes/seats'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/tickets', require('./routes/tickets'));
// NOTE: tickets routes: GET /today, GET /booking/:id, GET /:id, PUT /verify/:id
app.use('/api/dashboard', require('./routes/dashboard'));
 
// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));
 
// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});
 
setInterval(async () => {
  await db.query(`
    UPDATE bookings
    SET status = 'cancelled'
    WHERE status = 'pending'
    AND expires_at < NOW()
  `);
}, 60000);
 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🎬 Cinema server running on port ${PORT}`));