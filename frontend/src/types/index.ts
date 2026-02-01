export interface Employee {
  id: number
  uuid: string
  store_id: number
  name: string
  email: string
  role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'WAITER' | 'KITCHEN'
  is_active: boolean
}

export interface Shift {
  id: number
  uuid: string
  store_id: number
  employee_id: number
  terminal_id: number | null
  status: 'OPEN' | 'CLOSED'
  start_time: string
  end_time: string | null
  starting_cash: string
  expected_cash: string | null
  actual_cash: string | null
  difference: string | null
}

export type TaxType = 'NONE' | 'COMMERCIAL' | 'SERVICE' | 'BOTH'

export interface StoreSettings {
  commercial_tax_rate: number
  commercial_tax_inclusive: boolean
  service_charge_rate: number
  service_charge_inclusive: boolean
  default_tax_type: TaxType
}

export interface Product {
  id: number
  uuid: string
  store_id: number
  category_id: number
  name: string
  description: string | null
  image_url: string | null
  is_active: boolean
  is_taxable: boolean
  variants: ProductVariant[]
  modifier_groups?: ModifierGroup[]
  tax_group_id?: number | null
  tax_group?: TaxGroup | null
}

export interface TaxGroup {
  id: number
  store_id: number
  name: string
  taxes: Tax[]
}

export interface Tax {
  id: number
  tax_group_id: number
  name: string
  rate: string
  is_inclusive: boolean
  priority: number
}

export interface ProductVariant {
  id: number
  uuid: string
  product_id: number
  sku: string
  name: string
  price: string
  cost: string
  is_default: boolean
  is_active: boolean
}

export interface Order {
  id: number
  uuid: string
  store_id: number
  shift_id: number
  table_session_id: number | null
  employee_id: number
  customer_id: number | null
  order_number: string
  type: 'DINE_IN' | 'TAKEOUT' | 'TAKE_OUT' | 'DELIVERY'
  tax_type: TaxType
  status: 'OPEN' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'VOIDED' | 'REFUNDED'
  payment_status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID'
  subtotal: string
  total_tax: string
  total_discount: string
  created_at?: string
  updated_at?: string
  grand_total: string
  total_paid: string
  items: OrderItem[]
  payments?: Payment[]
  tax_lines?: OrderTaxLine[]
}

export interface OrderTaxLine {
  id: number
  order_id: number
  tax_name: string
  tax_rate: string
  tax_amount: string
}

export interface OrderItem {
  id: number
  uuid: string
  order_id: number
  variant_id: number
  quantity: number
  unit_price: string
  total_line_amount: string
  kitchen_status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED'
  is_voided: boolean
  variant?: ProductVariant
  modifiers?: any[] // Added for API response compatibility
}

export interface Payment {
  id: number
  uuid: string
  order_id: number
  type: 'PAYMENT' | 'REFUND'
  method: 'CASH' | 'CARD' | 'MOBILE'
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  amount: string
  tip_amount: string
}

export interface Category {
  id: number
  uuid?: string
  store_id: number
  name: string
  color_hex?: string
  color?: string | null
  sort_order?: number
  is_active?: boolean
  products?: Product[]
}

export interface ModifierGroup {
  id: number
  name: string
  min_select: number
  max_select: number
  modifiers: Modifier[]
}

export interface Modifier {
  id: number
  group_id: number
  name: string
  price_extra: string
  cost_extra: string
}

export interface CartItem {
  id: string // Unique ID for the cart item (variantId + modifiers hash)
  variant: ProductVariant
  product: Product
  quantity: number
  modifiers: Modifier[]
  notes?: string
}

export interface Floor {
  id: number
  uuid: string
  store_id: number
  name: string
  tables: Table[]
}

export interface Table {
  id: number
  uuid: string
  floor_id: number
  name: string
  capacity: number
  pos_x: number
  pos_y: number
  width: number
  height: number
  shape: 'SQUARE' | 'ROUND' | 'RECTANGLE'
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED'
  active_session?: TableSession
}

export interface TableSession {
  id: number
  uuid: string
  table_id: number
  employee_id?: number
  status: 'ACTIVE' | 'CLOSED' | 'PAYING'
  guest_count: number
  started_at?: string
  closed_at?: string | null
  order_count?: number
  order_total?: string
}
