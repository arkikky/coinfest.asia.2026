export type TypeCouponEnum = "percentage" | "fixed_amount" | "free_shipping";

export type RecordStatus = "draft" | "published" | "archived";

export interface Coupon {
  id?: number;
  id_coupons: string;
  id_events: string;
  id_type_coupons: string;
  coupon_code_name: string;
  type_coupon: TypeCouponEnum;
  amount?: number | null;
  expired_date?: string | null;
  usage_limit?: number | null;
  current_usage: number;
  included_products?: string[] | null;
  min_total_purchase?: number | null;
  is_active: boolean;
  sale_label?: string | null;
  sale_shortdesc?: string | null;
  is_public: boolean;
  created_by: string;
  updated_by: string;
  rank_record?: number;
  record_status: RecordStatus;
  created_at?: string;
  updated_at?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountAmount?: number;
}
