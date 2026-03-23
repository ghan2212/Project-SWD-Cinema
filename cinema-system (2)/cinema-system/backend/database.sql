-- Cinema Management System Database Schema
-- Run this script to initialize the database

CREATE DATABASE IF NOT EXISTS cinema_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cinema_db;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('ticket_staff'), ('customer') ON DUPLICATE KEY UPDATE name=name;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role_id INT NOT NULL DEFAULT 4,
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO categories (name) VALUES 
('Action'), ('Comedy'), ('Drama'), ('Horror'), ('Sci-Fi'), 
('Romance'), ('Animation'), ('Thriller'), ('Documentary'), ('Fantasy')
ON DUPLICATE KEY UPDATE name=name;

-- Movies table
CREATE TABLE IF NOT EXISTS movies (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  duration INT NOT NULL COMMENT 'Duration in minutes',
  release_date DATE,
  status ENUM('coming_soon', 'now_showing', 'ended') DEFAULT 'coming_soon',
  category_id INT,
  poster_url VARCHAR(255),
  trailer_url VARCHAR(255),
  director VARCHAR(100),
  cast_members TEXT,
  rating DECIMAL(3,1) DEFAULT 0,
  language VARCHAR(50) DEFAULT 'Vietnamese',
  age_rating VARCHAR(10) DEFAULT 'P',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Cinema rooms table
CREATE TABLE IF NOT EXISTS cinema_rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  total_seats INT NOT NULL,
  status ENUM('active', 'maintenance') DEFAULT 'active'
);

-- Seats table
CREATE TABLE IF NOT EXISTS seats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  room_id INT NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  seat_type ENUM('standard', 'vip', 'couple') DEFAULT 'standard',
  FOREIGN KEY (room_id) REFERENCES cinema_rooms(id),
  UNIQUE KEY unique_seat (room_id, seat_number)
);

-- Showtimes table
CREATE TABLE IF NOT EXISTS showtimes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  movie_id INT NOT NULL,
  room_id INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  show_date DATE NOT NULL,
  price_standard DECIMAL(10,2) DEFAULT 90000,
  price_vip DECIMAL(10,2) DEFAULT 120000,
  price_couple DECIMAL(10,2) DEFAULT 200000,
  status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (room_id) REFERENCES cinema_rooms(id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  showtime_id INT NOT NULL,
  booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (showtime_id) REFERENCES showtimes(id)
);

-- Booking details table
CREATE TABLE IF NOT EXISTS booking_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  seat_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (seat_id) REFERENCES seats(id)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  qr_code VARCHAR(255) UNIQUE,
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('valid', 'used', 'cancelled') DEFAULT 'valid',
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('vnpay', 'cash', 'card') DEFAULT 'vnpay',
  status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending',
  transaction_code VARCHAR(100),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

-- Sample data
INSERT INTO users (full_name, email, phone, password, role_id, status) VALUES
('Super Admin', 'admin@cinema.com', '0901234567', '$2a$10$rQnHmCXFGwLPCnXC5RqD0eQ3Kq1WoGHYODJqZ9X8vLmN2pYhI6QJi', 1, 'active'),
('Cinema Manager', 'manager@cinema.com', '0901234568', '$2a$10$rQnHmCXFGwLPCnXC5RqD0eQ3Kq1WoGHYODJqZ9X8vLmN2pYhI6QJi', 2, 'active'),
('Ticket Staff', 'staff@cinema.com', '0901234569', '$2a$10$rQnHmCXFGwLPCnXC5RqD0eQ3Kq1WoGHYODJqZ9X8vLmN2pYhI6QJi', 3, 'active'),
('John Customer', 'customer@cinema.com', '0901234570', '$2a$10$rQnHmCXFGwLPCnXC5RqD0eQ3Kq1WoGHYODJqZ9X8vLmN2pYhI6QJi', 4, 'active')
ON DUPLICATE KEY UPDATE email=email;
-- Default password for all accounts: cinema123

INSERT INTO cinema_rooms (name, total_seats, status) VALUES
('Phòng 1', 80, 'active'),
('Phòng 2', 100, 'active'),
('Phòng 3 VIP', 60, 'active'),
('Phòng 4', 120, 'active'),
('Phòng 5 IMAX', 150, 'active')
ON DUPLICATE KEY UPDATE name=name;

INSERT INTO movies (title, description, duration, release_date, status, category_id, poster_url, director, cast_members, rating, language, age_rating) VALUES
('Avengers: Secret Wars', 'The ultimate battle for the multiverse begins as heroes from every dimension unite.', 150, '2026-05-01', 'coming_soon', 1, 'https://via.placeholder.com/300x450/1a1a2e/e94560?text=Avengers', 'Russo Brothers', 'Robert Downey Jr., Chris Evans, Scarlett Johansson', 9.2, 'English', 'T13'),
('Lật Mặt 8', 'Bộ phim hành động Việt Nam bom tấn với những pha hành động mãn nhãn.', 135, '2026-04-20', 'now_showing', 1, 'https://via.placeholder.com/300x450/16213e/0f3460?text=Lat+Mat+8', 'Lý Hải', 'Lý Hải, Đinh Ngọc Diệp', 8.5, 'Vietnamese', 'T16'),
('Inside Out 3', 'Riley faces new emotions in this heartwarming Pixar adventure.', 100, '2026-06-15', 'coming_soon', 7, 'https://via.placeholder.com/300x450/533483/e94560?text=Inside+Out+3', 'Pete Docter', 'Amy Poehler, Mindy Kaling', 8.8, 'English', 'P'),
('Kẻ Trộm Mặt Trăng 4', 'Gru và các Minion trở lại trong cuộc phiêu lưu mới.', 95, '2026-03-28', 'now_showing', 7, 'https://via.placeholder.com/300x450/0f3460/e94560?text=Minions', 'Pierre Coffin', 'Steve Carell', 8.1, 'English', 'P'),
('Inception 2', 'Dom Cobb returns for another mind-bending dream heist.', 148, '2026-07-10', 'coming_soon', 8, 'https://via.placeholder.com/300x450/1a1a2e/533483?text=Inception+2', 'Christopher Nolan', 'Leonardo DiCaprio, Joseph Gordon-Levitt', 9.5, 'English', 'T13')
ON DUPLICATE KEY UPDATE title=title;
