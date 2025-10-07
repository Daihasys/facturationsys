-- # Requisitos para Sistema de Facturación
-- Este script SQL desarrolla la base de datos completa para un sistema de facturación, 
-- cumpliendo con los requisitos de los módulos de usuarios, productos, ventas y reportes.

-- --- TABLA DE ROLES ---
-- Almacena los roles de usuario (Ej: "Administrador", "Vendedor")
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- --- TABLA DE USUARIOS ---
-- Gestiona las cuentas de usuario y sus roles.
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rol_id INT NOT NULL,
    nombre_completo VARCHAR(100) NOT NULL,
    correo_electronico VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- --- TABLA DE PRODUCTOS ---
-- Catálogo completo de productos disponibles para la venta.
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio_costo DECIMAL(10, 2) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    categoria VARCHAR(100),
    image_url TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- --- TABLA DE TASA DE CAMBIO ---
-- Almacena el historial diario de la tasa de cambio de USD a VES.
CREATE TABLE tasas_de_cambio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tasa DECIMAL(10, 4) NOT NULL,
    fecha DATE NOT NULL UNIQUE
);


-- --- TABLA DE FACTURAS ---
-- Registra cada venta realizada, incluyendo totales y la tasa de cambio aplicada.
CREATE TABLE facturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tasa_id INT NOT NULL,
    total_usd DECIMAL(10, 2) NOT NULL,
    total_ves DECIMAL(15, 2) NOT NULL,
    fecha_factura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (tasa_id) REFERENCES tasas_de_cambio(id)
);

-- --- TABLA DE DETALLES DE FACTURA ---
-- Tabla intermedia que relaciona los productos y cantidades de cada factura.
CREATE TABLE factura_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    factura_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario_usd DECIMAL(10, 2) NOT NULL,
    subtotal_usd DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (factura_id) REFERENCES facturas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- --- TABLA DE BITÁCORA DE ACCIONES ---
-- Registra todas las acciones importantes realizadas por los usuarios en el sistema.
CREATE TABLE bitacora_acciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    accion VARCHAR(255) NOT NULL,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);


-- --- INSERCIÓN DE DATOS INICIALES ---
-- Precarga los roles y métodos de pago definidos en los requisitos.
INSERT INTO roles (nombre) VALUES ('Administrador'), ('Vendedor');