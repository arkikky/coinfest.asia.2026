import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gfohembnkqffkzzcdptj.supabase.co";
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2hlbWJua3FmZmt6emNkcHRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcwMzYwMCwiZXhwIjoyMDc5Mjc5NjAwfQ.8iaspyGv0nZDCZR5vUlq9P5c7Q_MdWSzmPgHiZ-Fb7A";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

type RecordStatus = "draft" | "published" | "archived";
type TypeCoupon = "percentage" | "fixed_amount";

const DEFAULT_USER_ID = "4675f1dc-a1f6-48e6-8c36-51ecce5813d6";

// Event IDs yang akan digunakan
const EVENT_IDS = [
  "cdfde64e-f9a7-42b7-bc48-165cb57ca5cc",
  "405dbb02-a4a4-43c1-8156-09e915adb78a",
  "c1919043-2c56-4751-a5cc-515dc7189934",
];

// Type Coupon IDs yang akan digunakan (pastikan ini benar-benar ada di tabel type_coupons)
const TYPE_COUPON_IDS = [
  "2cc2be69-6952-4598-87a2-83f126b2948a",
  "93357ab0-2718-4fd4-869e-e553073271e7",
  "7cdc87e9-fe59-44e6-adf9-9af14430ad1f",
];

function getRandomStatus(): RecordStatus {
  const statuses: RecordStatus[] = ["draft", "published"];
  return faker.helpers.arrayElement(statuses);
}

function getRandomTypeCoupon(): TypeCoupon {
  const types: TypeCoupon[] = ["percentage", "fixed_amount"];
  return faker.helpers.arrayElement(types);
}

function generateCouponCode(): string {
  const prefix = faker.helpers.arrayElement(["SAVE", "DISC", "PROMO", "DEAL"]);
  const suffix = faker.string.alphanumeric(6).toUpperCase();
  return `${prefix}${suffix}`;
}

async function createFakeCoupon(eventId: string) {
  const typeCoupon = getRandomTypeCoupon();

  const isActive = faker.datatype.boolean({ probability: 0.7 });
  const isPublic = faker.datatype.boolean({ probability: 0.4 });
  const hasUsageLimit = faker.datatype.boolean({ probability: 0.6 });
  const hasMinPurchase = faker.datatype.boolean({ probability: 0.5 });

  const amount = typeCoupon === "percentage"
    ? faker.number.float({ min: 5, max: 50, fractionDigits: 2 })
    : faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 });

  const usageLimit = hasUsageLimit 
    ? faker.number.int({ min: 10, max: 1000 }) 
    : null;

  const currentUsage = usageLimit 
    ? faker.number.int({ min: 0, max: Math.floor(usageLimit * 0.3) })
    : 0;

  const { data: couponData, error } = await supabaseAdmin
    .from("coupons")
    .insert({
      id_events: eventId,
      id_type_coupons: faker.helpers.arrayElement(TYPE_COUPON_IDS),
      coupon_code_name: generateCouponCode(),
      type_coupon: typeCoupon,
      amount: amount,
      expired_date: faker.date.future({ years: 1 }).toISOString(),
      usage_limit: usageLimit,
      current_usage: currentUsage,
      min_total_purchase: hasMinPurchase 
        ? faker.number.float({ min: 50000, max: 1000000, fractionDigits: 2 })
        : null,
      is_active: isActive,
      sale_label: faker.commerce.productAdjective() + " Sale",
      sale_shortdesc: faker.commerce.productDescription().substring(0, 100),
      is_public: isPublic,
      created_by: DEFAULT_USER_ID,
      updated_by: DEFAULT_USER_ID,
      rank_record: faker.number.int({ min: 0, max: 100 }),
      record_status: getRandomStatus(),
    })
    .select("id_coupons")
    .single();

  if (error) {
    console.error("Error inserting coupon:", error);
    return null;
  }

  return couponData.id_coupons as string;
}

// Fungsi untuk mengambil random existing product IDs (asumsi tabel products sudah ada data)
async function getRandomProductIds(count: number): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id_products")
    .limit(count * 5); // ambil lebih banyak untuk random

  if (error || !data || data.length === 0) {
    console.warn("No products found or error:", error);
    return [];
  }

  const shuffled = faker.helpers.shuffle(data);
  return shuffled.slice(0, count).map((p: any) => p.id_products);
}

async function main() {
  console.log("Generating fake coupons + relations to products...");
  console.log(`Event IDs: ${EVENT_IDS.join(", ")}`);

  const totalCoupons = 160;
  const couponProductRelations: any[] = [];

  for (let i = 0; i < totalCoupons; i++) {
    const randomEventId = faker.helpers.arrayElement(EVENT_IDS);
    const couponId = await createFakeCoupon(randomEventId);

    if (!couponId) continue;

    // 50% chance coupon berlaku untuk beberapa produk spesifik (1-5 produk)
    const appliesToSpecificProducts = faker.datatype.boolean({ probability: 0.5 });
    if (appliesToSpecificProducts) {
      const numProducts = faker.number.int({ min: 1, max: 5 });
      const productIds = await getRandomProductIds(numProducts);

      for (const productId of productIds) {
        couponProductRelations.push({
          id_coupons: couponId,
          id_products: productId,
          created_by: DEFAULT_USER_ID,
          updated_by: DEFAULT_USER_ID,
          rank_record: faker.number.int({ min: 0, max: 100 }),
          record_status: getRandomStatus(),
        });
      }
    }

    // Progress log
    if ((i + 1) % 20 === 0) {
      console.log(`Processed ${i + 1}/${totalCoupons} coupons...`);
    }
  }

  // Insert semua relasi coupon_products sekaligus
  if (couponProductRelations.length > 0) {
    console.log(`\nInserting ${couponProductRelations.length} relations into coupon_products...`);

    const { data, error } = await supabaseAdmin
      .from("coupon_products")
      .insert(couponProductRelations)
      .select();

    if (error) {
      console.error("Error inserting coupon_products relations:", error);
      process.exit(1);
    }

    console.log(`✅ Successfully inserted ${data?.length ?? 0} coupon-product relations`);
  } else {
    console.log("No coupon-product relations generated.");
  }

  // Statistik sederhana
  console.log("\nSeeding completed!");
  console.log(`Total coupons created: ${totalCoupons}`);
  console.log(`Total coupon-product links: ${couponProductRelations.length}`);

  process.exit(0);
}

main().catch(console.error);