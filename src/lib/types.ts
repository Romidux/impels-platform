// ─── Auth ────────────────────────────────────────────────────────────────────
export type UserRole = "owner" | "admin" | "editor";

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

// ─── Store ───────────────────────────────────────────────────────────────────
export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  owner_id: string;
  plan: "free" | "pro";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreMember {
  id: string;
  store_id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  store_id: string;
  currency: string;
  whatsapp_number: string;
  contact_email?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  twitter_url?: string;
  template: "minimal" | "modern" | "brand";
  primary_color: string;
  secondary_color: string;
  hero_title?: string;
  hero_subtitle?: string;
  benefits_bar_items?: string[];
}

export interface StoreBranding {
  id: string;
  store_id: string;
  logo_url?: string;
  favicon_url?: string;
  hero_banner_url?: string;
  promo_banner_url?: string;
  promo_banner_title?: string;
  promo_banner_subtitle?: string;
  promo_banner_cta?: string;
  promo_banner_url_link?: string;
  footer_categories_label?: string;
  footer_contact_label?: string;
}

export interface StoreSection {
  id: string;
  store_id: string;
  section: string;
  is_visible: boolean;
  sort_order: number;
}

// ─── Catalog ─────────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  image_url?: string;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  subcategories?: Category[];
}

export type ProductVisibility = "visible" | "hidden";
export type ProductStockStatus = "available" | "out_of_stock";

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  show_price: boolean;
  category_id?: string;
  visibility: ProductVisibility;
  has_variants: boolean;
  stock_quantity: number;
  track_inventory: boolean;
  manage_stock_by_variant: boolean;
  allow_backorder: boolean;
  stock_status: ProductStockStatus;
  is_featured: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
  option_types?: ProductOptionType[];
  variant_combinations?: ProductVariantCombination[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt?: string;
  sort_order: number;
  is_primary: boolean;
}

export interface ProductOptionType {
  id: string;
  product_id: string;
  store_id: string;
  name: string; // e.g. "Color", "Size"
  sort_order: number;
  values?: ProductOptionValue[];
}

export interface ProductOptionValue {
  id: string;
  option_type_id: string;
  value: string; // e.g. "Red", "XL"
  sort_order: number;
}

export interface ProductVariantCombination {
  id: string;
  product_id: string;
  option_values: string[]; // array of option_value IDs
  price?: number;
  stock: number;
  sku?: string;
  is_active: boolean;
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  customer_notes?: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  variant_label?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export interface CartItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  product_slug: string;
  variant_combination_id?: string;
  variant_label?: string;
  price: number;
  quantity: number;
}

// ─── Plans ───────────────────────────────────────────────────────────────────
export interface Plan {
  id: string;
  name: string;
  slug: "free" | "pro";
  price: number;
  currency: string;
  max_products: number;
  features: string[];
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_products: number;
  total_orders: number;
  total_revenue: number;
  new_orders: number;
  recent_orders: Order[];
}
