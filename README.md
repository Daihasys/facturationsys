# 🧾 Catire VRS - Sistema de Facturación

<div align="center">

![Electron](https://img.shields.io/badge/Electron-38.2.0-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Sistema integral de punto de venta (POS) para pequeños y medianos negocios**

[Características](#-características) • [Tech Stack](#-tech-stack) • [Arquitectura](#-arquitectura) • [Instalación](#-instalación)

</div>

---

## 📋 Descripción

**Catire VRS** es una aplicación de escritorio full-stack diseñada para la gestión completa de ventas, inventario y facturación. Desarrollada con arquitectura moderna cliente-servidor, ofrece una experiencia robusta y profesional para operaciones comerciales diarias.

### ¿Qué problema resuelve?

- ✅ Gestión centralizada de inventario con alertas de stock
- ✅ Procesamiento rápido de ventas con múltiples métodos de pago
- ✅ Control de acceso granular basado en roles (RBAC)
- ✅ Respaldos automáticos con sincronización cloud
- ✅ Reportería avanzada para toma de decisiones

---

## ✨ Características

### 🛒 Gestión de Ventas
- Punto de venta intuitivo con búsqueda por código de barras
- Procesamiento en tiempo real con cálculo automático de totales
- Soporte para múltiples tasas de cambio (USD/VES)
- Generación e impresión de tickets

### 📦 Inventario
- CRUD completo de productos y categorías
- Sistema de códigos de barras únicos
- Gestión de precios (costo/venta)
- Búsqueda y filtrado avanzado

### 🔐 Seguridad y Control de Acceso
- Autenticación segura con bcrypt
- Sistema RBAC con 15+ permisos granulares
- Recuperación de contraseña con preguntas de seguridad
- Bitácora de auditoría de todas las acciones

### 💾 Backups Inteligentes
- Respaldos automáticos programables
- Estrategia de retención 3-2-1 (30 diarios, 7 semanales, 4 mensuales)
- **Sincronización con Dropbox** para respaldo cloud
- Restauración con un clic

### 📊 Reportería
- Dashboard con KPIs en tiempo real
- Exportación a PDF y Excel
- Reportes de ventas por período
- Análisis de productos más vendidos

### 🔔 Integraciones
- **Telegram**: Notificaciones de errores automáticas
- **Dropbox**: Backup cloud automático
- Gestión de tasas de cambio

---

## 🛠 Tech Stack

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 19, TailwindCSS 3, Lucide Icons, Recharts |
| **Backend** | Node.js, Express 5 |
| **Database** | SQLite 3 (embedded) |
| **Desktop** | Electron 38 |
| **Build** | Webpack 5, Babel, electron-builder |
| **Cloud** | Dropbox API |
| **Utilities** | bcrypt, jsPDF, ExcelJS, html2canvas |

---

## 🏗 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON MAIN PROCESS                     │
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │    main.js      │     │       preload.js            │   │
│  │  (App Lifecycle)│     │  (Context Bridge)           │   │
│  └─────────────────┘     └─────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌─────────────┐      ┌─────────────────┐     ┌─────────────┐
│   RENDERER  │      │   EXPRESS API   │     │   SQLITE    │
│   (React)   │◄────►│   (server.js)   │◄───►│  Database   │
│             │ HTTP │   Port 4000     │     │             │
└─────────────┘      └─────────────────┘     └─────────────┘
       │                      │
       │              ┌───────┴───────┐
       │              ▼               ▼
       │        ┌──────────┐   ┌──────────┐
       │        │ Dropbox  │   │ Telegram │
       │        │   API    │   │   Bot    │
       │        └──────────┘   └──────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│           FRONTEND MODULES              │
├─────────────────────────────────────────┤
│ • Dashboard       • Sales       • Users │
│ • Products        • Reports     • Roles │
│ • Categories      • Backups     • Offers│
└─────────────────────────────────────────┘
```

### Estructura del Proyecto

```
facturacionsys/
├── src/
│   ├── components/
│   │   ├── auth/           # Login, recuperación de contraseña
│   │   ├── dashboard/      # KPIs, gráficos, bitácora
│   │   ├── layout/         # Sidebar, Header, Layout
│   │   ├── modals/         # 20+ modales reutilizables
│   │   ├── pages/          # Vistas principales
│   │   └── tickets/        # Generación de tickets
│   ├── context/            # AuthContext (estado global)
│   └── utils/              # Helpers y utilidades
├── database/               # SQLite DB y backups
├── utils/
│   ├── telegram.js         # Integración Telegram
│   └── dropbox.js          # Integración Dropbox
├── server.js               # API RESTful (2400+ líneas)
├── main.js                 # Electron main process
└── preload.js              # Context bridge
```

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Git

### Clonar e instalar

```bash
git clone https://github.com/Daihasys/facturacionsys.git
cd facturacionsys
npm install
```

### Configurar variables de entorno

Crear archivo `.env` en la raíz:

```env
# Telegram (opcional - para notificaciones de errores)
TELEGRAM_BOT_TOKEN=tu_token_bot
TELEGRAM_CHAT_ID=tu_chat_id

# Dropbox (opcional - para backup cloud)
DROPBOX_ACCESS_TOKEN=tu_access_token
```

### Ejecutar en desarrollo

```bash
npm run dev
```

---

## 🔧 Aspectos Técnicos Destacados

| Área | Implementación |
|------|----------------|
| **Backups** | Estrategia de retención 3-2-1, upload automático a Dropbox |
| **Seguridad** | bcrypt (salt: 10), validación de permisos por endpoint |
| **Base de Datos** | busyTimeout configurado, migraciones automáticas |
| **Empaquetado** | Paths dinámicos dev/prod, desempaquetado de módulos nativos |

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 👨‍💻 Autor

**Samuel Acosta**  
Ingeniero Informático | Full-Stack Developer

[![GitHub](https://img.shields.io/badge/GitHub-Daihasys-181717?style=flat-square&logo=github)](https://github.com/Daihasys)
