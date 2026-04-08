-- ============================================
-- VíasBot - Estructura Completa de Base de Datos
-- ============================================
-- Este archivo contiene toda la estructura SQL necesaria
-- para desplegar VíasBot en Railway o Clever Cloud
--
-- Uso:
-- 1. Crea una nueva base de datos en Railway/Clever Cloud
-- 2. Copia todo el contenido de este archivo
-- 3. Ejecuta en el SQL Editor o CLI
-- 4. Listo para usar

-- ============================================
-- Tabla: users (Usuarios autenticados con Manus OAuth)
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_openId_unique` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: telegram_users (Usuarios que interactúan con el bot)
-- ============================================
CREATE TABLE IF NOT EXISTS `telegram_users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `telegram_id` varchar(64) NOT NULL,
  `username` varchar(255),
  `first_name` varchar(255),
  `last_name` varchar(255),
  `last_message_at` timestamp NULL,
  `message_count` int DEFAULT 0,
  `is_blocked` int DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `telegram_users_telegram_id_unique` (`telegram_id`),
  INDEX `idx_telegram_id` (`telegram_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: frequent_routes (Rutas frecuentes guardadas)
-- ============================================
CREATE TABLE IF NOT EXISTS `frequent_routes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `start_location` varchar(255) NOT NULL,
  `end_location` varchar(255) NOT NULL,
  `start_lat` varchar(20) NOT NULL,
  `start_lng` varchar(20) NOT NULL,
  `end_lat` varchar(20) NOT NULL,
  `end_lng` varchar(20) NOT NULL,
  `is_active` int DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: queries (Historial de consultas de usuarios)
-- ============================================
CREATE TABLE IF NOT EXISTS `queries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `telegram_user_id` int NOT NULL,
  `query_text` text NOT NULL,
  `query_type` varchar(50) NOT NULL,
  `location` varchar(255),
  `latitude` varchar(20),
  `longitude` varchar(20),
  `response_time` int,
  `success` int DEFAULT 1,
  `error_message` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_telegram_user_id` (`telegram_user_id`),
  INDEX `idx_query_type` (`query_type`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_queries_telegram_user` FOREIGN KEY (`telegram_user_id`) 
    REFERENCES `telegram_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: query_responses (Respuestas enviadas a usuarios)
-- ============================================
CREATE TABLE IF NOT EXISTS `query_responses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `query_id` int NOT NULL,
  `telegram_user_id` int NOT NULL,
  `response_text` text NOT NULL,
  `traffic_data` json,
  `weather_data` json,
  `incident_data` json,
  `message_id` varchar(255),
  `delivery_status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_query_id` (`query_id`),
  KEY `fk_telegram_user_id` (`telegram_user_id`),
  INDEX `idx_delivery_status` (`delivery_status`),
  INDEX `idx_created_at` (`created_at`),
  CONSTRAINT `fk_query_responses_query` FOREIGN KEY (`query_id`) 
    REFERENCES `queries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_query_responses_telegram_user` FOREIGN KEY (`telegram_user_id`) 
    REFERENCES `telegram_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: api_logs (Logs de llamadas a APIs externas)
-- ============================================
CREATE TABLE IF NOT EXISTS `api_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `api_name` varchar(100) NOT NULL,
  `endpoint` varchar(255) NOT NULL,
  `status_code` int,
  `response_time` int,
  `success` int DEFAULT 1,
  `error_message` text,
  `request_data` json,
  `response_data` json,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_api_name` (`api_name`),
  INDEX `idx_success` (`success`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: error_logs (Logs de errores del sistema)
-- ============================================
CREATE TABLE IF NOT EXISTS `error_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `error_type` varchar(100) NOT NULL,
  `error_message` text NOT NULL,
  `stack_trace` text,
  `context` json,
  `severity` varchar(20) DEFAULT 'error',
  `resolved` int DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_error_type` (`error_type`),
  INDEX `idx_severity` (`severity`),
  INDEX `idx_resolved` (`resolved`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tabla: analytics_summary (Estadísticas diarias agregadas)
-- ============================================
CREATE TABLE IF NOT EXISTS `analytics_summary` (
  `id` int AUTO_INCREMENT NOT NULL,
  `date` varchar(10) NOT NULL,
  `total_queries` int DEFAULT 0,
  `total_users` int DEFAULT 0,
  `avg_response_time` int DEFAULT 0,
  `success_rate` varchar(10) DEFAULT '100',
  `top_query_type` varchar(50),
  `top_location` varchar(255),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `analytics_summary_date_unique` (`date`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Índices Adicionales para Optimización
-- ============================================

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS `idx_queries_telegram_user_created` 
  ON `queries` (`telegram_user_id`, `created_at`);

CREATE INDEX IF NOT EXISTS `idx_query_responses_created` 
  ON `query_responses` (`created_at`);

CREATE INDEX IF NOT EXISTS `idx_telegram_users_last_message` 
  ON `telegram_users` (`last_message_at`);

-- ============================================
-- Vistas Útiles (Opcional)
-- ============================================

-- Vista: Estadísticas por usuario
CREATE OR REPLACE VIEW `v_user_stats` AS
SELECT 
  tu.id,
  tu.telegram_id,
  tu.username,
  tu.first_name,
  COUNT(q.id) as total_queries,
  AVG(q.response_time) as avg_response_time,
  SUM(CASE WHEN q.success = 1 THEN 1 ELSE 0 END) as successful_queries,
  tu.created_at,
  tu.last_message_at
FROM `telegram_users` tu
LEFT JOIN `queries` q ON tu.id = q.telegram_user_id
GROUP BY tu.id;

-- Vista: Consultas recientes con respuestas
CREATE OR REPLACE VIEW `v_recent_queries` AS
SELECT 
  q.id,
  tu.telegram_id,
  tu.username,
  q.query_text,
  q.query_type,
  q.location,
  q.response_time,
  q.success,
  qr.response_text,
  qr.delivery_status,
  q.created_at
FROM `queries` q
JOIN `telegram_users` tu ON q.telegram_user_id = tu.id
LEFT JOIN `query_responses` qr ON q.id = qr.query_id
ORDER BY q.created_at DESC
LIMIT 100;

-- ============================================
-- Procedimientos Almacenados (Opcional)
-- ============================================

-- Procedimiento: Insertar o actualizar usuario de Telegram
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_upsert_telegram_user`(
  IN p_telegram_id VARCHAR(64),
  IN p_username VARCHAR(255),
  IN p_first_name VARCHAR(255),
  IN p_last_name VARCHAR(255)
)
BEGIN
  INSERT INTO `telegram_users` (telegram_id, username, first_name, last_name, last_message_at, message_count)
  VALUES (p_telegram_id, p_username, p_first_name, p_last_name, NOW(), 1)
  ON DUPLICATE KEY UPDATE
    username = COALESCE(p_username, username),
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    last_message_at = NOW(),
    message_count = message_count + 1;
END //
DELIMITER ;

-- Procedimiento: Registrar consulta
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `sp_log_query`(
  IN p_telegram_user_id INT,
  IN p_query_text TEXT,
  IN p_query_type VARCHAR(50),
  IN p_location VARCHAR(255),
  IN p_latitude VARCHAR(20),
  IN p_longitude VARCHAR(20),
  IN p_response_time INT,
  IN p_success INT,
  IN p_error_message TEXT
)
BEGIN
  INSERT INTO `queries` (
    telegram_user_id, query_text, query_type, location, 
    latitude, longitude, response_time, success, error_message
  ) VALUES (
    p_telegram_user_id, p_query_text, p_query_type, p_location,
    p_latitude, p_longitude, p_response_time, p_success, p_error_message
  );
END //
DELIMITER ;

-- ============================================
-- Datos de Ejemplo (Opcional)
-- ============================================

-- Insertar usuario de ejemplo
INSERT IGNORE INTO `telegram_users` (telegram_id, username, first_name, last_name)
VALUES ('123456789', 'testuser', 'Test', 'User');

-- Insertar ruta de ejemplo
INSERT IGNORE INTO `frequent_routes` (name, description, start_location, end_location, start_lat, start_lng, end_lat, end_lng)
VALUES ('Ruta al Trabajo', 'Casa a Oficina', 'Casa', 'Oficina', '4.7110', '-74.0721', '4.7200', '-74.0800');

-- ============================================
-- Información de Conexión
-- ============================================
-- 
-- Para Railway:
-- 1. Ve a tu proyecto en railway.app
-- 2. Haz clic en "MySQL" en el panel de servicios
-- 3. Ve a la pestaña "Connect"
-- 4. Copia la URL de conexión
-- 5. En el SQL Editor, pega este script completo
-- 6. Ejecuta
--
-- Para Clever Cloud:
-- 1. Ve a tu aplicación en console.clever-cloud.com
-- 2. Ve a "MySQL" en los servicios
-- 3. Abre el SQL Editor
-- 4. Pega este script completo
-- 5. Ejecuta
--
-- Para Conexión Local:
-- mysql -u usuario -p nombre_base_datos < DATABASE_SCHEMA.sql
--
-- ============================================
-- Verificación
-- ============================================
-- Ejecuta esto para verificar que todo se creó correctamente:
--
-- SHOW TABLES;
-- SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = DATABASE();
-- SELECT * FROM v_user_stats;
-- SELECT * FROM v_recent_queries;
--
-- ============================================
