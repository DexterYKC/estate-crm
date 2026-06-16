-- ============================================================
-- MySQL 8.0 schema for Prestige Immobilier — production VPS
-- ============================================================
CREATE DATABASE IF NOT EXISTS prestige_immobilier CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE prestige_immobilier;

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','agent','user') NOT NULL DEFAULT 'user',
  phone VARCHAR(40),
  status ENUM('pending','accepted','suspended') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE agents (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  bio TEXT,
  photo VARCHAR(500),
  speciality VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE properties (
  id VARCHAR(36) PRIMARY KEY,
  agent_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('appartement','maison','terrain','commercial') NOT NULL,
  transaction ENUM('vente','location') NOT NULL,
  price BIGINT NOT NULL,
  surface INT,
  rooms INT,
  floor INT,
  city VARCHAR(120),
  district VARCHAR(120),
  address VARCHAR(255),
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  views INT NOT NULL DEFAULT 0,
  tour_enabled TINYINT(1) NOT NULL DEFAULT 0,
  tour_url VARCHAR(500),
  featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type), INDEX idx_transaction (transaction), INDEX idx_city (city),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE property_images (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36) NOT NULL,
  url VARCHAR(500) NOT NULL,
  is_main TINYINT(1) NOT NULL DEFAULT 0,
  `order` INT NOT NULL DEFAULT 0,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE property_amenities (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36) NOT NULL,
  amenity VARCHAR(120) NOT NULL,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE requests (
  id VARCHAR(36) PRIMARY KEY,
  property_id VARCHAR(36),
  user_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(40),
  message TEXT,
  contact_preference ENUM('email','whatsapp','call','visit') DEFAULT 'email',
  status ENUM('new','in_progress','closed') NOT NULL DEFAULT 'new',
  agent_id VARCHAR(36),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE favorites (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  property_id VARCHAR(36) NOT NULL,
  UNIQUE KEY uq_fav (user_id, property_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE appointments (
  id VARCHAR(36) PRIMARY KEY,
  agent_id VARCHAR(36),
  client_name VARCHAR(255),
  client_phone VARCHAR(40),
  date DATE,
  time TIME,
  notes TEXT,
  status ENUM('scheduled','done','cancelled') DEFAULT 'scheduled',
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE agency_settings (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255),
  address VARCHAR(255),
  phone VARCHAR(40),
  whatsapp VARCHAR(40),
  email VARCHAR(255),
  about TEXT,
  maps_embed VARCHAR(800)
) ENGINE=InnoDB;
