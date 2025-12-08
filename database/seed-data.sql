-- ================================================
-- SCRIPT DE DATOS DE PRUEBA - SISTEMA DE FACTURACIÓN
-- ================================================
-- Este script usa INSERT OR IGNORE para evitar duplicados
-- y obtiene los IDs correctos dinámicamente
-- ================================================

-- ================================================
-- CATEGORÍAS DE PRODUCTOS
-- ================================================

INSERT OR IGNORE INTO categorias (nombre_categoria, descripcion) VALUES
('Alimentos', 'Productos alimenticios en general'),
('Bebidas', 'Refrescos, jugos y bebidas en general'),
('Lácteos', 'Productos lácteos y derivados'),
('Carnes', 'Carnes rojas, blancas y embutidos'),
('Panadería', 'Pan, pasteles y productos de panadería'),
('Higiene Personal', 'Productos de aseo personal'),
('Limpieza', 'Productos de limpieza para el hogar'),
('Snacks', 'Dulces, galletas y bocadillos'),
('Granos', 'Arroz, pasta, granos y cereales'),
('Enlatados', 'Conservas y productos enlatados');

-- ================================================
-- USUARIOS ADICIONALES
-- ================================================
-- Contraseña para todos: "password123"

INSERT OR IGNORE INTO usuarios (rol_id, nombre_completo, cedula, contrasena, telefono, nombre_usuario) VALUES
(2, 'María Rodríguez', '12345678901', '$2b$10$HoKrRfvvbzQLW98ZaAqGoe8WHtFlGrngRnB3BZx9S7okA/j62lq6K', '04121234567', 'maria.r'),
(2, 'Carlos Mendoza', '23456789012', '$2b$10$HoKrRfvvbzQLW98ZaAqGoe8WHtFlGrngRnB3BZx9S7okA/j62lq6K', '04242345678', 'carlos.m'),
(2, 'Ana Fernández', '34567890123', '$2b$10$HoKrRfvvbzQLW98ZaAqGoe8WHtFlGrngRnB3BZx9S7okA/j62lq6K', '04143456789', 'ana.f'),
(2, 'Luis García', '45678901234', '$2b$10$HoKrRfvvbzQLW98ZaAqGoe8WHtFlGrngRnB3BZx9S7okA/j62lq6K', '04264567890', 'luis.g');

-- ================================================
-- PRODUCTOS VARIADOS
-- ================================================

INSERT OR IGNORE INTO productos (nombre, descripcion, precio_costo, precio_venta, categoria, barcode) VALUES
-- Granos
('Arroz Diana 1kg', 'Arroz blanco premium', 1.20, 1.80, 'Granos', '7501234567890'),
('Pasta Primor 500g', 'Pasta de trigo', 0.80, 1.20, 'Granos', '7501234567891'),
('Azúcar refinada 1kg', 'Azúcar blanca refinada', 0.90, 1.35, 'Alimentos', '7501234567892'),
('Aceite Mazeite 1L', 'Aceite vegetal', 3.50, 5.00, 'Alimentos', '7501234567893'),
('Harina de maíz PAN 1kg', 'Harina precocida', 1.50, 2.25, 'Alimentos', '7501234567894'),

-- Bebidas
('Coca Cola 2L', 'Refresco cola', 1.80, 2.70, 'Bebidas', '7501234567895'),
('Pepsi 2L', 'Refresco cola', 1.70, 2.55, 'Bebidas', '7501234567896'),
('Malta Regional 330ml', 'Malta venezolana', 0.60, 0.90, 'Bebidas', '7501234567897'),
('Agua Mineral 1.5L', 'Agua embotellada', 0.40, 0.70, 'Bebidas', '7501234567898'),
('Jugo Hit 1L Durazno', 'Jugo de frutas', 1.20, 1.80, 'Bebidas', '7501234567899'),

-- Lácteos
('Leche Completa 1L', 'Leche entera pasteurizada', 1.50, 2.25, 'Lácteos', '7501234567900'),
('Queso Paisa 500g', 'Queso blanco', 3.00, 4.50, 'Lácteos', '7501234567901'),
('Mantequilla 250g', 'Mantequilla con sal', 2.00, 3.00, 'Lácteos', '7501234567902'),
('Yogurt Natural 1L', 'Yogurt sin azúcar', 1.80, 2.70, 'Lácteos', '7501234567903'),

-- Carnes
('Pollo Entero', 'Pollo fresco por kg', 2.50, 3.75, 'Carnes', '7501234567904'),
('Carne Molida kg', 'Carne molida de res', 4.00, 6.00, 'Carnes', '7501234567905'),
('Jamón Virginia 200g', 'Jamón de pavo', 2.50, 3.75, 'Carnes', '7501234567906'),

-- Panadería
('Pan Canilla 500g', 'Pan tradicional', 1.00, 1.50, 'Panadería', '7501234567907'),
('Pan de Sandwich', 'Pan tajado', 1.20, 1.80, 'Panadería', '7501234567908'),
('Galletas María 200g', 'Galletas dulces', 0.80, 1.20, 'Panadería', '7501234567909'),

-- Higiene Personal
('Jabón Protex 110g', 'Jabón antibacterial', 1.00, 1.50, 'Higiene Personal', '7501234567910'),
('Champú Pantene 400ml', 'Champú para cabello', 4.00, 6.00, 'Higiene Personal', '7501234567911'),
('Pasta Dental Colgate', 'Pasta dental triple acción', 2.50, 3.75, 'Higiene Personal', '7501234567912'),
('Desodorante Axe', 'Desodorante en spray', 3.50, 5.25, 'Higiene Personal', '7501234567913'),

-- Limpieza
('Cloro 1L', 'Blanqueador desinfectante', 1.20, 1.80, 'Limpieza', '7501234567914'),
('Jabón Lavaloza 500ml', 'Detergente líquido', 1.50, 2.25, 'Limpieza', '7501234567915'),
('Detergente Ace 1kg', 'Detergente en polvo', 3.00, 4.50, 'Limpieza', '7501234567916'),

-- Snacks
('Doritos Queso 150g', 'Nachos sabor queso', 1.50, 2.25, 'Snacks', '7501234567917'),
('Chocolatina Savoy', 'Chocolate con leche', 0.50, 0.75, 'Snacks', '7501234567918'),
('Chicles Trident', 'Chicles sin azúcar', 0.80, 1.20, 'Snacks', '7501234567919'),
('Papas Lays 200g', 'Papas fritas naturales', 2.00, 3.00, 'Snacks', '7501234567920'),

-- Enlatados
('Atún Van Camps', 'Atún en aceite', 1.80, 2.70, 'Enlatados', '7501234567921'),
('Sardinas La Gaviota', 'Sardinas en tomate', 1.20, 1.80, 'Enlatados', '7501234567922'),
('Mayonesa Mavesa 500g', 'Mayonesa tradicional', 2.50, 3.75, 'Enlatados', '7501234567923');

-- ================================================
-- VENTAS DE PRUEBA (Últimos 3 meses)
-- ================================================
-- Usando los IDs reales de usuarios y tasas

-- Diciembre 2025 - Ventas del usuario admin (id=1)
INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura) VALUES
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-02' LIMIT 1), 45.50, 11256.88, 'Completada', '2025-12-01 09:15:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-02' LIMIT 1), 67.80, 16773.12, 'Completada', '2025-12-01 14:30:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-03' LIMIT 1), 123.45, 30723.48, 'Completada', '2025-12-02 10:45:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-03' LIMIT 1), 89.90, 22385.58, 'Completada', '2025-12-02 16:20:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-03' LIMIT 1), 156.70, 39050.44, 'Completada', '2025-12-03 11:05:00');

-- Ventas de María (si existe)
INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura)
SELECT 
  u.id,
  (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-02' LIMIT 1),
  34.20,
  8461.02,
  'Completada',
  '2025-12-01 10:00:00'
FROM usuarios u
WHERE u.nombre_usuario = 'maria.r'
LIMIT 1;

INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura)
SELECT 
  u.id,
  (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-02' LIMIT 1),
  78.90,
  19523.49,
  'Completada',
  '2025-12-01 15:45:00'
FROM usuarios u
WHERE u.nombre_usuario = 'maria.r'
LIMIT 1;

-- Ventas de Carlos (si existe)
INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura)
SELECT 
  u.id,
  (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-02' LIMIT 1),
  67.50,
  16698.75,
  'Completada',
  '2025-12-01 11:30:00'
FROM usuarios u
WHERE u.nombre_usuario = 'carlos.m'
LIMIT 1;

INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura)
SELECT 
  u.id,
  (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-03' LIMIT 1),
  134.80,
  33555.92,
  'Completada',
  '2025-12-02 14:00:00'
FROM usuarios u
WHERE u.nombre_usuario = 'carlos.m'
LIMIT 1;

-- Ventas de Ana (si existe)
INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura)
SELECT 
  u.id,
  (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-02' LIMIT 1),
  89.40,
  22117.14,
  'Completada',
  '2025-12-01 13:00:00'
FROM usuarios u
WHERE u.nombre_usuario = 'ana.f'
LIMIT 1;

INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura)
SELECT 
  u.id,
  (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-03' LIMIT 1),
  112.50,
  28003.50,
  'Completada',
  '2025-12-02 15:30:00'
FROM usuarios u
WHERE u.nombre_usuario = 'ana.f'
LIMIT 1;

-- Ventas de Luis (si existe)
INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura)
SELECT 
  u.id,
  (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-02' LIMIT 1),
  45.80,
  11331.38,
  'Completada',
  '2025-12-01 16:00:00'
FROM usuarios u
WHERE u.nombre_usuario = 'luis.g'
LIMIT 1;

INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura)
SELECT 
  u.id,
  (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-03' LIMIT 1),
  78.20,
  19469.64,
  'Completada',
  '2025-12-03 12:00:00'
FROM usuarios u
WHERE u.nombre_usuario = 'luis.g'
LIMIT 1;

-- Noviembre 2025 (solo usuario admin para simplificar)
INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura) VALUES
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-01' LIMIT 1), 156.20, 5701.30, 'Completada', '2025-11-05 10:00:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-01' LIMIT 1), 278.90, 10179.85, 'Completada', '2025-11-08 15:30:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-01' LIMIT 1), 98.45, 3593.43, 'Completada', '2025-11-12 09:20:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-01' LIMIT 1), 187.60, 6847.40, 'Completada', '2025-11-15 14:10:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-11-28' LIMIT 1), 145.30, 5303.45, 'Completada', '2025-11-22 16:00:00');

-- Octubre 2025
INSERT INTO facturas (usuario_id, tasa_id, total_usd, total_ves, estado, fecha_factura) VALUES
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-01' LIMIT 1), 198.40, 7241.60, 'Completada', '2025-10-03 09:00:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-01' LIMIT 1), 267.85, 9776.53, 'Completada', '2025-10-07 12:00:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-01' LIMIT 1), 134.90, 4923.85, 'Completada', '2025-10-11 15:45:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-01' LIMIT 1), 421.30, 15377.45, 'Completada', '2025-10-14 10:20:00'),
(1, (SELECT id FROM tasas_de_cambio WHERE fecha = '2025-12-01' LIMIT 1), 156.70, 5719.55, 'Completada', '2025-10-18 14:30:00');

-- ================================================
-- DETALLES DE FACTURAS
-- ================================================
-- Usando subqueries para obtener los IDs correctos

-- Detalles para las primeras facturas del admin
INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario_usd, subtotal_usd)
SELECT 
  (SELECT id FROM facturas WHERE usuario_id = 1 AND total_usd = 45.50 AND fecha_factura LIKE '2025-12-01%' LIMIT 1),
  (SELECT id FROM productos WHERE barcode = '7501234567890' LIMIT 1),
  2,
  1.80,
  3.60
WHERE EXISTS (SELECT 1 FROM facturas WHERE usuario_id = 1 AND total_usd = 45.50)
  AND EXISTS (SELECT 1 FROM productos WHERE barcode = '7501234567890');

INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario_usd, subtotal_usd)
SELECT 
  (SELECT id FROM facturas WHERE usuario_id = 1 AND total_usd = 45.50 AND fecha_factura LIKE '2025-12-01%' LIMIT 1),
  (SELECT id FROM productos WHERE barcode = '7501234567895' LIMIT 1),
  3,
  2.70,
  8.10
WHERE EXISTS (SELECT 1 FROM facturas WHERE usuario_id = 1 AND total_usd = 45.50)
  AND EXISTS (SELECT 1 FROM productos WHERE barcode = '7501234567895');

INSERT INTO factura_detalles (factura_id, producto_id, cantidad, precio_unitario_usd, subtotal_usd)
SELECT 
  (SELECT id FROM facturas WHERE usuario_id = 1 AND total_usd = 45.50 AND fecha_factura LIKE '2025-12-01%' LIMIT 1),
  (SELECT id FROM productos WHERE barcode = '7501234567900' LIMIT 1),
  2,
  2.25,
  4.50
WHERE EXISTS (SELECT 1 FROM facturas WHERE usuario_id = 1 AND total_usd = 45.50)
  AND EXISTS (SELECT 1 FROM productos WHERE barcode = '7501234567900');

-- ================================================
-- FIN DEL SCRIPT DE DATOS DE PRUEBA
-- ================================================

SELECT '✅ Datos de prueba insertados exitosamente!' as resultado;
SELECT COUNT(*) as total_categorias FROM categorias;
SELECT COUNT(*) as total_productos FROM productos;
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as total_facturas FROM facturas;
SELECT COUNT(*) as total_detalles FROM factura_detalles;
