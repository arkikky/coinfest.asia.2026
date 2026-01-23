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

// Type Coupon IDs yang akan digunakan
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

function createFakeCoupon(eventId: string) {
  const typeCoupon = getRandomTypeCoupon();
  
  // 70% chance aktif
  const isActive = faker.datatype.boolean({ probability: 0.7 });
  
  // 40% chance public
  const isPublic = faker.datatype.boolean({ probability: 0.4 });
  
  // 60% chance memiliki usage limit
  const hasUsageLimit = faker.datatype.boolean({ probability: 0.6 });
  
  // 50% chance memiliki min purchase
  const hasMinPurchase = faker.datatype.boolean({ probability: 0.5 });
  
  // Amount berdasarkan type
  const amount = typeCoupon === "percentage"
    ? faker.number.float({ min: 5, max: 50, fractionDigits: 2 })
    : faker.number.float({ min: 10000, max: 500000, fractionDigits: 2 });
  
  const usageLimit = hasUsageLimit 
    ? faker.number.int({ min: 10, max: 1000 }) 
    : null;
  
  const currentUsage = usageLimit 
    ? faker.number.int({ min: 0, max: Math.floor(usageLimit * 0.3) })
    : 0;

  return {
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
  };
}

async function main() {
  console.log("Using predefined event IDs...");
  console.log(`Event IDs: ${EVENT_IDS.join(", ")}`);

  const totalCoupons = 160;
  const coupons = Array.from({ length: totalCoupons }, () => {
    const randomEventId = faker.helpers.arrayElement(EVENT_IDS);
    return createFakeCoupon(randomEventId);
  });

  console.log(`Inserting ${coupons.length} coupons...`);

  const { data, error } = await supabaseAdmin
    .from("coupons")
    .insert(coupons)
    .select(
      "id_coupons, coupon_code_name, type_coupon, amount, is_active, is_public, id_events"
    );

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data?.length ?? 0} coupons`);

  // Hitung distribusi per event
  if (data && data.length > 0) {
    const distribution = EVENT_IDS.map((eventId) => {
      const count = data.filter((c: any) => c.id_events === eventId).length;
      return { eventId, count };
    });

    console.log("\nDistribution per event:");
    distribution.forEach((d) => {
      console.log(`- Event ${d.eventId.slice(0, 8)}...: ${d.count} coupons`);
    });

    // Statistik type coupon
    const percentageCount = data.filter((c: any) => c.type_coupon === "percentage").length;
    const fixedAmountCount = data.filter((c: any) => c.type_coupon === "fixed_amount").length;
    console.log(`\nCoupon Type Statistics:`);
    console.log(
      `- Percentage: ${percentageCount} (${((percentageCount / data.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `- Fixed Amount: ${fixedAmountCount} (${((fixedAmountCount / data.length) * 100).toFixed(1)}%)`
    );

    // Statistik active
    const activeCount = data.filter((c: any) => c.is_active).length;
    console.log(`\nActive Statistics:`);
    console.log(
      `- Active: ${activeCount} (${((activeCount / data.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `- Inactive: ${data.length - activeCount} (${(((data.length - activeCount) / data.length) * 100).toFixed(1)}%)`
    );

    // Statistik public
    const publicCount = data.filter((c: any) => c.is_public).length;
    console.log(`\nPublic Statistics:`);
    console.log(
      `- Public: ${publicCount} (${((publicCount / data.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `- Private: ${data.length - publicCount} (${(((data.length - publicCount) / data.length) * 100).toFixed(1)}%)`
    );
  }

  process.exit(0);
}

main();