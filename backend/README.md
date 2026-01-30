# ERP-POS Backend API

A Laravel-based REST API for a Point of Sale (POS) system with multi-tenant support, employee management, order processing, inventory tracking, and shift management.

## Features

### Authentication
- PIN-based employee authentication
- JWT token management via Laravel Sanctum
- Role-based access control (OWNER, MANAGER, CASHIER, WAITER, KITCHEN)

### Order Management
- Create orders (DINE_IN, TAKEOUT, DELIVERY)
- Order lifecycle: OPEN → CONFIRMED → COMPLETED
- Payment processing with multiple methods (CASH, CARD, MOBILE)
- Partial payments support
- Order voiding with inventory rollback
- Tax and discount calculations

### Shift Management
- Open/close shifts with cash tracking
- Expected vs actual cash reconciliation
- Shift-based payment aggregation

### Floor & Table Management
- Floor layouts with table configurations
- Table session management
- Real-time table status tracking

### Inventory
- Real-time inventory tracking
- Automatic stock decrement on sales
- Inventory rollback on order void
- Low stock threshold alerts
- Optimistic locking for concurrent updates

### Tax & Discounts
- Tax groups with multiple tax rates
- Inclusive/exclusive tax support
- Predefined and manual discounts
- Percentage and fixed amount discounts

## Installation

```bash
# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed database (optional)
php artisan db:seed
```

## Configuration

### Environment Variables

```env
DB_CONNECTION=sqlite
DB_DATABASE=/path/to/database.sqlite

# Or for MySQL/PostgreSQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=erp_pos
DB_USERNAME=root
DB_PASSWORD=
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Employee login with email/PIN |
| POST | `/api/v1/auth/logout` | Logout current session |
| GET | `/api/v1/auth/me` | Get authenticated employee profile |

### Shifts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/shifts` | Open a new shift |
| GET | `/api/v1/shifts/current` | Get current open shift |
| POST | `/api/v1/shifts/{id}/close` | Close shift with cash count |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create a new order |
| POST | `/api/v1/orders/{uuid}/confirm` | Confirm order (send to kitchen) |
| POST | `/api/v1/orders/{uuid}/pay` | Process payment |
| POST | `/api/v1/orders/{uuid}/void` | Void unpaid order |

### Floor Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/floor` | Get floor layout with table status |
| POST | `/api/v1/floor/tables/{id}/open` | Open table session |
| POST | `/api/v1/floor/sessions/{id}/close` | Close table session |

## Testing

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test --filter=OrderTest

# Run with coverage
php artisan test --coverage
```

### Test Results
```
Tests:    22 passed (71 assertions)
Duration: 0.52s

✓ Auth (login, logout, profile)
✓ Shifts (open, current, close)
✓ Orders (create, confirm, pay, void)
✓ Floor (layout, sessions)
```

## Project Structure

```
app/
├── Actions/              # Single-purpose action classes
│   ├── Orders/
│   │   ├── CreateOrder.php
│   │   ├── ConfirmOrder.php
│   │   ├── PayOrder.php
│   │   └── VoidOrder.php
│   └── Shifts/
│       ├── OpenShift.php
│       └── CloseShift.php
├── Http/
│   ├── Controllers/Api/V1/
│   │   ├── AuthController.php
│   │   ├── ShiftController.php
│   │   ├── OrderController.php
│   │   └── FloorController.php
│   └── Resources/        # API response transformers
├── Models/               # Eloquent models
├── Services/             # Business logic services
│   ├── TaxService.php
│   ├── DiscountService.php
│   ├── InventoryService.php
│   └── AuditLogger.php
└── Support/
    └── Money.php         # Decimal arithmetic helper
```

## Money Calculations

The application uses a custom `Money` helper class for precise decimal arithmetic:

```php
use App\Support\Money;

Money::add('10.00', '5.50');      // '15.50'
Money::sub('10.00', '3.25');      // '6.75'
Money::mul('10.00', 2);           // '20.00'
Money::div('10.00', 3);           // '3.33'
Money::compare('10.00', '10.00'); // 0 (equal)
```

## Database Schema

### Core Tables
- `tenants` - Multi-tenant organizations
- `stores` - Physical store locations
- `employees` - Staff with roles and PINs
- `products` / `product_variants` - Menu items
- `orders` / `order_items` - Order data
- `payments` - Payment transactions
- `shifts` - Cashier shifts
- `inventory_levels` / `inventory_transactions` - Stock tracking

### Supporting Tables
- `tax_groups` / `taxes` - Tax configuration
- `discounts` - Predefined discounts
- `floors` / `tables` / `table_sessions` - Floor management
- `audit_logs` - Action audit trail

## License

Proprietary - All rights reserved.
