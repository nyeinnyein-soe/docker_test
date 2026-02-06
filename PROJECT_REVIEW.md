# ERP-POS System Review & Familiarization

A robust, multi-tenant POS system built with **Laravel 11** and **React 18**.

## Architecture Overview

The project is split into a modern decoupled architecture:
- **Backend**: Laravel REST API following an Action-Service pattern.
- **Frontend**: React Single Page Application (SPA) with Zustand for state management.

```mermaid
graph TD
    subgraph Frontend
        App[App Shell]
        Stores[Zustand Stores: Auth, Cart, Config]
        Pages[POS Modes: Retail, Cafe, Restaurant]
        App --> Stores
        App --> Pages
    end
    
    subgraph Backend
        Controllers[API Controllers]
        Actions[Business Logic Actions]
        Services[Infrastructure Services]
        Models[Eloquent Models]
        Controllers --> Actions
        Actions --> Services
        Actions --> Models
    end
    
    Pages -- Axios --> Controllers
```

## Detailed Architecture

### Core Data Model
The system uses a multi-tenant relational schema optimized for POS operations.

```mermaid
erDiagram
    STORE ||--o{ EMPLOYEE : employs
    STORE ||--o{ PRODUCT : owns
    STORE ||--o{ SHIFT : tracks
    STORE ||--o{ TERMINAL : manages
    
    EMPLOYEE ||--o{ ORDER : creates
    SHIFT ||--o{ ORDER : contains
    
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    PRODUCT ||--o{ MODIFIER_GROUP : uses
    
    ORDER ||--o{ ORDER_ITEM : including
    ORDER_ITEM ||--|| PRODUCT_VARIANT : "references"
    ORDER_ITEM ||--o{ ORDER_ITEM_MODIFIER : "customized by"
    
    TABLE_SESSION ||--o{ ORDER : "groups for dine-in"
    DINING_TABLE ||--o{ TABLE_SESSION : "has history"
```

### Order Request Flow
This diagram illustrates the lifecycle of a sale from the UI to the inventory ledger.

```mermaid
sequenceDiagram
    participant UI as React POS UI
    participant Store as Zustand Cart Store
    participant API as Laravel OrderController
    participant Action as CreateOrder Action
    participant Inv as InventoryService
    participant DB as Database

    UI->>Store: addItem(variant, modifiers)
    UI->>UI: View Cart & Total
    UI->>API: POST /api/orders (payload)
    API->>Action: __invoke(data)
    Action->>DB: Start Transaction
    Action->>DB: Create Order & Items
    Action->>Inv: decrementForSale(order)
    Inv->>DB: Update Stock Level & Log Transaction
    Action->>DB: Commit Transaction
    Action-->>API: Order Object
    API-->>UI: 201 Created (Success)
```

### POS Mode Logic
The application dynamically adapts its core interface based on the store's business type.

```mermaid
graph LR
    ModeSelector{POS Mode?}
    
    ModeSelector -- Retail --> RetailSell[Simple Product Grid + Fast Checkout]
    ModeSelector -- Cafe --> CafeSell[Variant Selection + Custom Modifiers]
    ModeSelector -- Restaurant --> RestSell[Floor Map + Table Management + Bill Splitting]
    
    RetailSell --> CartStore
    CafeSell --> CartStore
    RestSell --> CartStore
    
    CartStore --> Payment[Unified Payment Flow]
```

## Key Components

### 1. Multi-tenant Data Model
The system supports multiple stores and organizations. Every core entity (Employees, Products, Orders, Shifts) is scoped by a `store_id`.

### 2. Authentication System
- **PIN-based login**: Touch-optimized for POS terminals.
- **Role-based Access Control (RBAC)**: Supports roles like OWNER, MANAGER, CASHIER, WAITER, and KITCHEN.

### 3. POS Modes
The system transitions seamlessly between different business types:
- **Retail**: Grid-based product selection with direct checkout.
- **Cafe**: Support for complex product variants and modifier groups.
- **Restaurant**: Interactive floor map with table session management and bill consolidation.

### 4. Financial & Inventory Integrity
- **Money Handling**: Uses a custom `Money` utility to ensure decimal precision across PHP and JavaScript.
- **Tax System**: Snapshot-aware tax configuration ensures historical accuracy for orders even if store settings change.
- **Inventory Audit Trail**: Every stock change is recorded in an `inventory_transactions` ledger for full auditability.

## Technical Highlights

| Feature | Implementation Detail |
| :--- | :--- |
| **Framework** | Laravel 11 (Backend), React 18 (Frontend) |
| **State** | Zustand (highly performant and small boilerplate) |
| **Styling** | Tailwind CSS 4 with a custom touch-friendly design system |
| **Database** | Migration-based schema with integer-based money columns |
| **Concurrency** | Optimistic locking for inventory levels to prevent race conditions |

## Verification & Status
- **Backend Tests**: 22 passing tests covering core order and inventory logic.
- **Frontend Readiness**: Integrated with the API via a centralized client with token persistence.
- **Documentation**: Comprehensive installation and troubleshooting guides provided in the root.

---
*Review completed by Antigravity.*
