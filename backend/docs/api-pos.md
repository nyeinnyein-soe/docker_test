# ERP POS API Reference

Base URL: `http://localhost:8000/api`

## Authentication

All endpoints except `/api/auth/login` require Bearer token authentication via Laravel Sanctum.

Include the token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### Authentication

#### POST /api/auth/login

Authenticate an employee using their PIN.

**Request:**
```json
{
  "store_id": 1,
  "email": "manager@example.com",
  "pin": "1234"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| store_id | integer | Yes | Store ID |
| email | string (email) | Yes | Employee email |
| pin | string | Yes | 4-6 digit PIN |

**Response (200):**
```json
{
  "token": "1|abc123...",
  "employee": {
    "id": 1,
    "uuid": "30bce713-eb90-47b2-b281-ca9ff03a74c9",
    "first_name": "Demo",
    "last_name": "Manager",
    "email": "manager@example.com"
  },
  "store_id": 1,
  "role": "Manager",
  "permissions": ["void_order", "refund_payment", "view_reports", "manage_menu"]
}
```

**Error (422 - Validation):**
```json
{
  "message": "The provided credentials are incorrect.",
  "errors": {
    "pin": ["The provided credentials are incorrect."]
  }
}
```

---

#### POST /api/auth/logout

Revoke the current access token.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logged out"
}
```

---

#### GET /api/auth/me

Get the authenticated employee's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "uuid": "30bce713-eb90-47b2-b281-ca9ff03a74c9",
  "store_id": 1,
  "role_id": 1,
  "first_name": "Demo",
  "last_name": "Manager",
  "email": "manager@example.com",
  "is_active": true,
  "deleted_at": null,
  "created_at": "2026-01-28T10:00:00.000000Z",
  "updated_at": "2026-01-28T10:00:00.000000Z",
  "role": {
    "id": 1,
    "store_id": 1,
    "name": "Manager",
    "permissions": ["void_order", "refund_payment", "view_reports", "manage_menu"],
    "created_at": "2026-01-28T10:00:00.000000Z",
    "updated_at": "2026-01-28T10:00:00.000000Z"
  },
  "store": {
    "id": 1,
    "uuid": "abc-123-...",
    "name": "Demo Store",
    "currency_code": "USD",
    "time_zone": "UTC",
    "tax_registration_no": null,
    "is_active": true,
    "created_at": "2026-01-28T10:00:00.000000Z",
    "updated_at": "2026-01-28T10:00:00.000000Z"
  }
}
```

---

### Menu

#### GET /api/menu

Get the full menu for a terminal (categories, products, variants, modifiers).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| terminal_uuid | uuid | Yes | Terminal UUID |

**Example:** `GET /api/menu?terminal_uuid=abc-123-...`

**Response (200):**
```json
{
  "store": {
    "id": 1,
    "uuid": "abc-123-...",
    "name": "Demo Store",
    "currency_code": "USD"
  },
  "terminal": {
    "id": 1,
    "uuid": "def-456-...",
    "name": "Front Counter 1"
  },
  "categories": [
    {
      "id": 1,
      "store_id": 1,
      "name": "Hot Drinks",
      "color_hex": "#F97316",
      "parent_id": null,
      "printer_destination": "KITCHEN",
      "deleted_at": null,
      "created_at": "2026-01-28T10:00:00.000000Z",
      "updated_at": "2026-01-28T10:00:00.000000Z"
    }
  ],
  "products": [
    {
      "id": 1,
      "uuid": "prod-uuid-...",
      "store_id": 1,
      "category_id": 1,
      "tax_group_id": null,
      "name": "Coffee",
      "description": "Fresh brewed coffee",
      "type": "VARIABLE",
      "image_url": null,
      "is_active": true,
      "deleted_at": null,
      "created_at": "2026-01-28T10:00:00.000000Z",
      "updated_at": "2026-01-28T10:00:00.000000Z",
      "variants": [
        {
          "id": 1,
          "uuid": "var-uuid-1...",
          "product_id": 1,
          "name": "Small",
          "sku": "COF-SM",
          "price": "3.50",
          "cost": "1.00",
          "deleted_at": null,
          "created_at": "2026-01-28T10:00:00.000000Z",
          "updated_at": "2026-01-28T10:00:00.000000Z"
        },
        {
          "id": 2,
          "uuid": "var-uuid-2...",
          "product_id": 1,
          "name": "Large",
          "sku": "COF-LG",
          "price": "4.50",
          "cost": "1.30",
          "deleted_at": null,
          "created_at": "2026-01-28T10:00:00.000000Z",
          "updated_at": "2026-01-28T10:00:00.000000Z"
        }
      ]
    }
  ],
  "modifier_groups": [
    {
      "id": 1,
      "store_id": 1,
      "name": "Milk",
      "min_select": 0,
      "max_select": 1,
      "created_at": "2026-01-28T10:00:00.000000Z",
      "updated_at": "2026-01-28T10:00:00.000000Z",
      "modifiers": [
        {
          "id": 1,
          "group_id": 1,
          "name": "Oat Milk",
          "price_extra": "0.50",
          "cost_extra": "0.20",
          "created_at": "2026-01-28T10:00:00.000000Z",
          "updated_at": "2026-01-28T10:00:00.000000Z"
        }
      ]
    }
  ]
}
```

---

### Shifts

#### POST /api/shifts/open

Open a new shift for the authenticated employee.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "terminal_uuid": "def-456-...",
  "starting_cash": 100.00
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| terminal_uuid | uuid | Yes | Terminal UUID |
| starting_cash | numeric | Yes | Starting cash amount (min: 0) |

**Response (200):**
```json
{
  "id": 1,
  "uuid": "shift-uuid-...",
  "store_id": 1,
  "employee_id": 1,
  "terminal_id": 1,
  "start_time": "2026-01-28T10:00:00.000000Z",
  "end_time": null,
  "starting_cash": "100.00",
  "expected_cash": "0.00",
  "actual_cash": "0.00",
  "difference": "0.00",
  "status": "OPEN",
  "created_at": "2026-01-28T10:00:00.000000Z",
  "updated_at": "2026-01-28T10:00:00.000000Z"
}
```

---

#### GET /api/shifts/current

Get the current open shift for the authenticated employee.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "uuid": "shift-uuid-...",
  "store_id": 1,
  "employee_id": 1,
  "terminal_id": 1,
  "status": "OPEN",
  ...
}
```

**Response (404 - No open shift):**
```json
{
  "message": "No open shift found"
}
```

---

#### POST /api/shifts/{id}/close

Close an open shift.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "actual_cash": 250.00
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| actual_cash | numeric | Yes | Counted cash amount |

**Response (200):**
```json
{
  "id": 1,
  "uuid": "shift-uuid-...",
  "status": "CLOSED",
  "end_time": "2026-01-28T18:00:00.000000Z",
  "starting_cash": "100.00",
  "expected_cash": "150.00",
  "actual_cash": "250.00",
  "difference": "100.00",
  ...
}
```

---

### Orders

#### POST /api/orders

Create a new order.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "shift_id": 1,
  "type": "TAKE_OUT",
  "table_session_id": null,
  "customer_id": null,
  "order_number": "101",
  "tax_group_id": 1,
  "discount_id": null,
  "manual_discount": {
    "name": "Happy Hour",
    "type": "PERCENTAGE",
    "value": 10
  },
  "items": [
    {
      "variant_id": 1,
      "quantity": 2
    },
    {
      "variant_id": 2,
      "quantity": 1
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| shift_id | integer | Yes | Current shift ID |
| type | string | Yes | `DINE_IN`, `TAKE_OUT`, or `DELIVERY` |
| table_session_id | integer | No | Table session ID (for DINE_IN) |
| customer_id | integer | No | Customer ID |
| order_number | string | No | Order number (auto-generated if omitted) |
| tax_group_id | integer | No | Tax group ID to apply |
| discount_id | integer | No | Predefined discount ID |
| manual_discount | object | No | Manual discount object |
| manual_discount.name | string | Yes* | Discount name (*required if manual_discount provided) |
| manual_discount.type | string | Yes* | `PERCENTAGE` or `FIXED_AMOUNT` |
| manual_discount.value | numeric | Yes* | Discount value |
| items | array | Yes | Array of order items (min: 1) |
| items.*.variant_id | integer | Yes | Product variant ID |
| items.*.quantity | integer | Yes | Quantity (min: 1) |

**Response (201):**
```json
{
  "id": 1,
  "uuid": "order-uuid-...",
  "store_id": 1,
  "shift_id": 1,
  "table_session_id": null,
  "employee_id": 1,
  "customer_id": null,
  "order_number": "101",
  "type": "TAKE_OUT",
  "status": "OPEN",
  "payment_status": "UNPAID",
  "version": 1,
  "subtotal": "11.50",
  "total_tax": "0.00",
  "total_discount": "0.00",
  "grand_total": "11.50",
  "total_paid": "0.00",
  "created_at": "2026-01-28T10:00:00.000000Z",
  "updated_at": "2026-01-28T10:00:00.000000Z",
  "items": [
    {
      "id": 1,
      "uuid": "item-uuid-1...",
      "order_id": 1,
      "variant_id": 1,
      "quantity": 2,
      "unit_price": "3.50",
      "unit_cost": "1.00",
      "total_line_amount": "7.00",
      "kitchen_status": "PENDING",
      "is_voided": false,
      "void_reason_id": null,
      "created_at": "2026-01-28T10:00:00.000000Z",
      "updated_at": "2026-01-28T10:00:00.000000Z"
    },
    {
      "id": 2,
      "uuid": "item-uuid-2...",
      "order_id": 1,
      "variant_id": 2,
      "quantity": 1,
      "unit_price": "4.50",
      "unit_cost": "1.30",
      "total_line_amount": "4.50",
      "kitchen_status": "PENDING",
      "is_voided": false,
      "void_reason_id": null,
      "created_at": "2026-01-28T10:00:00.000000Z",
      "updated_at": "2026-01-28T10:00:00.000000Z"
    }
  ]
}
```

---

#### POST /api/orders/{uuid}/pay

Process a payment for an order.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "shift_id": 1,
  "terminal_uuid": "def-456-...",
  "method": "CASH",
  "amount": 11.50,
  "tip_amount": 2.00,
  "external_ref": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| shift_id | integer | Yes | Current shift ID |
| terminal_uuid | uuid | Yes | Terminal UUID |
| method | string | Yes | `CASH`, `CARD`, `QR`, `LOYALTY`, or `OTHER` |
| amount | numeric | Yes | Payment amount (min: 0) |
| tip_amount | numeric | No | Tip amount (min: 0) |
| external_ref | string | No | External reference (e.g., card auth code) |

**Response (200):**
```json
{
  "id": 1,
  "uuid": "order-uuid-...",
  "status": "COMPLETED",
  "payment_status": "PAID",
  "grand_total": "11.50",
  "total_paid": "11.50",
  "items": [...],
  "payments": [
    {
      "id": 1,
      "uuid": "payment-uuid-...",
      "store_id": 1,
      "order_id": 1,
      "shift_id": 1,
      "terminal_id": 1,
      "type": "PAYMENT",
      "method": "CASH",
      "status": "SUCCESS",
      "amount": "11.50",
      "tip_amount": "2.00",
      "external_ref": null,
      "parent_payment_id": null,
      "created_at": "2026-01-28T10:00:00.000000Z",
      "updated_at": "2026-01-28T10:00:00.000000Z"
    }
  ]
}
```

---

#### POST /api/orders/{uuid}/confirm

Confirm an order (send to kitchen).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "uuid": "order-uuid-...",
  "status": "CONFIRMED",
  ...
}
```

---

#### POST /api/orders/{uuid}/void

Void an order.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "reason": "Customer cancelled"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Void reason |

**Response (200):**
```json
{
  "id": 1,
  "uuid": "order-uuid-...",
  "status": "VOIDED",
  ...
}
```

---

### Floor & Table Sessions (Dine-In)

#### GET /api/floor

Get floor layout with sections, tables, and active sessions.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "sections": [
    {
      "id": 1,
      "store_id": 1,
      "name": "Main Dining",
      "tables": [
        {
          "id": 1,
          "section_id": 1,
          "name": "T1",
          "x_pos": 0,
          "y_pos": 0,
          "active_session": {
            "id": 1,
            "uuid": "session-uuid-...",
            "table_id": 1,
            "waiter_id": 1,
            "guest_count": 4,
            "status": "ACTIVE",
            "opened_at": "2026-01-28T10:00:00.000000Z"
          }
        },
        {
          "id": 2,
          "section_id": 1,
          "name": "T2",
          "x_pos": 100,
          "y_pos": 0,
          "active_session": null
        }
      ]
    }
  ]
}
```

---

#### POST /api/floor/sessions

Open a new table session.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "table_id": 1,
  "guest_count": 4
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| table_id | integer | Yes | Dining table ID |
| guest_count | integer | No | Number of guests (default: 1) |

**Response (201):**
```json
{
  "id": 1,
  "uuid": "session-uuid-...",
  "table_id": 1,
  "waiter_id": 1,
  "guest_count": 4,
  "status": "ACTIVE",
  "opened_at": "2026-01-28T10:00:00.000000Z",
  "closed_at": null
}
```

---

#### PUT /api/floor/sessions/{uuid}/close

Close a table session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "uuid": "session-uuid-...",
  "status": "CLOSED",
  "closed_at": "2026-01-28T12:00:00.000000Z"
}
```

---

### Sync Endpoints

#### GET /api/sync/menu

Get menu data updated after a specific time.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| updated_after | datetime | No | ISO8601 timestamp |

**Example:** `GET /api/sync/menu?updated_after=2026-01-28T10:00:00Z`

**Response (200):**
```json
{
  "categories": [...],
  "products": [...],
  "variants": [...],
  "modifier_groups": [...],
  "modifiers": [...]
}
```

---

#### GET /api/sync/customers

Get customers updated after a specific time.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| updated_after | datetime | No | ISO8601 timestamp |

**Response (200):**
```json
{
  "customers": [...]
}
```

---

## Error Responses

### Validation Error (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": [
      "Error message for this field."
    ]
  }
}
```

### Unauthenticated (401)

```json
{
  "message": "Unauthenticated."
}
```

### Not Found (404)

```json
{
  "message": "Resource not found"
}
```

### Server Error (500)

```json
{
  "message": "Server Error"
}
```

---

## Enums

### Order Type
- `DINE_IN`
- `TAKE_OUT`
- `DELIVERY`

### Order Status
- `OPEN`
- `CONFIRMED`
- `COMPLETED`
- `VOIDED`
- `REFUNDED`

### Payment Status
- `UNPAID`
- `PARTIALLY_PAID`
- `PAID`
- `OVERPAID`

### Payment Method
- `CASH`
- `CARD`
- `QR`
- `LOYALTY`
- `OTHER`

### Kitchen Status
- `PENDING`
- `SENT`
- `COOKING`
- `SERVED`

### Table Session Status
- `ACTIVE`
- `PAYING`
- `CLOSED`

### Shift Status
- `OPEN`
- `CLOSED`
