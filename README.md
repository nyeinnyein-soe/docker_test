# ERP-POS System

A multi-tenant Point of Sale (POS) system with a Laravel backend API and modern frontend.

## Installation

**For Ubuntu/Linux Development Setup:** See [INSTALLATION_UBUNTU.md](./INSTALLATION_UBUNTU.md) for detailed step-by-step installation instructions.

**For Troubleshooting & Production:** See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues, production setup, and maintenance procedures.

**For Docker Setup:** See [DOCKER.md](./DOCKER.md) for instructions on running the system using Docker.

## Quick Start (Development)

## Project Structure

```
erp-pos/
├── backend/          # Laravel REST API
├── frontend/         # Web application (planned)
└── README.md
```

## Backend API

The backend is built with Laravel 11 and provides a comprehensive REST API for POS operations.

### Key Features

- **Multi-tenant Architecture**: Support for multiple organizations and stores
- **Employee Authentication**: PIN-based login with role-based access control
- **Order Management**: Full order lifecycle from creation to payment
- **Inventory Tracking**: Real-time stock management with audit trail
- **Shift Management**: Cash reconciliation and shift reporting
- **Floor Management**: Table layouts and session tracking for dine-in

### Quick Start

**Backend:**
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Quick Start (Docker)

If you have Docker and Docker Compose installed:

```bash
docker compose up -d --build
```

For more details, see [DOCKER.md](./DOCKER.md).

The frontend runs at http://localhost:5173 and the backend API at http://localhost:8000.

**Demo Login:**
- Email: `manager@example.com`
- PIN: `1234`

### API Documentation

See [backend/README.md](./backend/README.md) for full API documentation.

### Running Tests

```bash
cd backend
php artisan test
```

**Current Status**: All 22 tests passing

## Technology Stack

### Backend
- PHP 8.2+
- Laravel 11
- SQLite/MySQL/PostgreSQL
- Laravel Sanctum (Authentication)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS 4
- Zustand (State Management)
- React Router
- Lucide Icons

## Development Changelog

### 2026-01-28: Backend Core Implementation

**Completed:**

1. **Database Schema**
   - Multi-tenant structure (tenants, stores, employees)
   - Products and variants with pricing
   - Orders, items, tax lines, discounts
   - Payments with multiple methods
   - Inventory levels and transactions
   - Shifts with cash tracking
   - Floor layouts and table sessions
   - Audit logging

2. **Authentication System**
   - Employee login with email/PIN
   - Sanctum token-based auth
   - Role-based permissions (OWNER, MANAGER, CASHIER, WAITER, KITCHEN)

3. **Order Processing**
   - Create orders (DINE_IN, TAKEOUT, DELIVERY)
   - Add items with variant support
   - Tax calculation (inclusive/exclusive)
   - Discount application (percentage/fixed)
   - Order confirmation workflow
   - Payment processing
   - Order voiding with inventory rollback

4. **Shift Management**
   - Open/close shifts
   - Starting cash tracking
   - Expected vs actual cash reconciliation
   - Shift-based payment aggregation

5. **Floor Management**
   - Floor layout retrieval
   - Table session open/close
   - Table status tracking

6. **Inventory System**
   - Automatic stock decrement on sale
   - Inventory rollback on void
   - Optimistic locking for concurrency
   - Transaction ledger

7. **Support Utilities**
   - Money helper for decimal arithmetic
   - Audit logging service

**Bug Fixes:**
- Fixed BCMath dependency by implementing `Money` helper class using standard PHP arithmetic

### Frontend Implementation

**Completed:**

1. **Project Setup**
   - Vite + React + TypeScript
   - Tailwind CSS 4 with custom POS-friendly theme
   - Path aliases (@/ for src/)

2. **UI Components**
   - Button (multiple variants and sizes for touch)
   - Card, Input, Badge
   - Touch-optimized with 44px minimum targets
   - NumPad reusable component
   - Bottom navigation bar

3. **State Management (Zustand)**
   - Auth store (login, logout, shift management)
   - Cart store (items, order type, quantities)
   - Config store (POS mode, business settings)
   - Orders store (order history)

4. **Complete Navigation Flow**
   - Splash screen with auth check
   - Login (PIN pad interface)
   - Setup Wizard (mode selection: Retail/Cafe/Restaurant)
   - Open Shift (cash drawer count)
   - Main App with 5-tab bottom navigation

5. **POS Modes**
   - **Retail**: Simple product grid + cart + payment
   - **Cafe**: Products with modifiers + customizations
   - **Restaurant**: Floor map + table management + kitchen flow

6. **Main Sections**
   - SELL: Mode-dependent order entry
   - ORDERS: History, filters, order details
   - ITEMS: Product CRUD with categories
   - SHIFT: Summary, cash control, close shift
   - SETTINGS: Business profile, POS mode switch

7. **Payment Flow**
   - Payment sheet with Cash/Card/Mobile options
   - Quick amount buttons
   - Change calculation for cash
   - Order completion

8. **API Integration**
   - Axios client with auth interceptors
   - Token persistence in localStorage
   - CORS configured for local development

## License

Proprietary - All rights reserved.
