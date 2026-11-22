-- =====================================================
-- Servicio de autenticación - Script 001
-- Crea la base de datos y la tabla de usuarios.
-- Ejecutar una sola vez en MySQL Workbench (botón del rayo).
-- =====================================================

CREATE DATABASE IF NOT EXISTS servicio_autenticacion
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE servicio_autenticacion;

CREATE TABLE IF NOT EXISTS usuarios (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  -- UNIQUE: MySQL rechaza un usuario repetido aunque el código fallara
  usuario         VARCHAR(30)  NOT NULL UNIQUE,
  -- Un hash de bcrypt siempre mide 60 caracteres. Nunca se guarda la contraseña original.
  contrasena_hash CHAR(60)     NOT NULL,
  fecha_creacion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
