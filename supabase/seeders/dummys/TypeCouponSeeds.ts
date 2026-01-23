import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gfohembnkqffkzzcdptj.supabase.co";
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2hlbWJua3FmZmt6emNkcHRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcwMzYwMCwiZXhwIjoyMDc5Mjc5NjAwfQ.8iaspyGv0nZDCZR5vUlq9P5c7Q_MdWSzmPgHiZ-Fb7A";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

type RecordStatus = "draft" | "published" | "archived";

const DEFAULT_USER_ID = "4675f1dc-a1f6-48e6-8c36-51ecce5813d6";

function getRandomStatus(): RecordStatus {
  const statuses: RecordStatus[] = ["draft", "published", "archived"];
  return faker.helpers.arrayElement(statuses);
}

function generateCouponName(): string {
  const prefixes = [
    "Early Bird",
    "VIP",
    "Student",
    "Group",
    "Corporate",
    "Premium",
    "Standard",
    "Flash Sale",
    "Weekend",
    "Special",
  ];
  
  const suffixes = [
    "Discount",
    "Pass",
    "Access",
    "Ticket",
    "Entry",
    "Package",
  ];
  
  return `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(suffixes)}`;
}

function generateCouponDescription(): string | null {
  // 80% chance memiliki description
  const hasDescription = faker.datatype.boolean({ probability: 0.8 });
  
  if (!hasDescription) return null;
  
  const descriptions = [
    `Get ${faker.number.int({ min: 10, max: 50 })}% off on your ticket purchase`,
    `Special discount for ${faker.company.buzzNoun()} enthusiasts`,
    `Limited time offer - ${faker.commerce.productAdjective()} pricing available`,
    `Exclusive deal for ${faker.helpers.arrayElement(["early registrants", "members", "students", "groups"])}`,
    `Save up to ${faker.commerce.price({ min: 10, max: 100, dec: 0 })} USD on event registration`,
    `Premium access with ${faker.commerce.productAdjective()} benefits included`,
  ];
  
  return faker.helpers.arrayElement(descriptions);
}

function createFakeTypeCoupon() {
  // 70% chance untuk status published
  const isPublished = faker.datatype.boolean({ probability: 0.7 });
  
  return {
    type_coupon_name: generateCouponName(),
    type_coupon_desc: generateCouponDescription(),
    created_by: DEFAULT_USER_ID,
    updated_by: DEFAULT_USER_ID,
    rank_record: faker.number.int({ min: 0, max: 100 }),
    record_status: isPublished 
      ? "published" 
      : getRandomStatus(),
  };
}

async function main() {
  console.log("Generating fake type coupons data...");

  const totalTypeCoupons = 25;
  const typeCoupons = Array.from({ length: totalTypeCoupons }, () =>
    createFakeTypeCoupon()
  );

  console.log(`Inserting ${typeCoupons.length} type coupons...`);

  const { data, error } = await supabaseAdmin
    .from("type_coupons")
    .insert(typeCoupons)
    .select(
      "id_type_coupons, type_coupon_name, type_coupon_desc, record_status, rank_record"
    );

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data?.length ?? 0} type coupons`);

  // Statistik per status
  if (data && data.length > 0) {
    const statusDistribution = {
      draft: data.filter((tc: any) => tc.record_status === "draft").length,
      published: data.filter((tc: any) => tc.record_status === "published").length,
      archived: data.filter((tc: any) => tc.record_status === "archived").length,
    };

    console.log("\nStatus Distribution:");
    console.log(`- Draft: ${statusDistribution.draft} (${((statusDistribution.draft / data.length) * 100).toFixed(1)}%)`);
    console.log(`- Published: ${statusDistribution.published} (${((statusDistribution.published / data.length) * 100).toFixed(1)}%)`);
    console.log(`- Archived: ${statusDistribution.archived} (${((statusDistribution.archived / data.length) * 100).toFixed(1)}%)`);

    // Statistik description
    const withDescription = data.filter((tc: any) => tc.type_coupon_desc !== null).length;
    console.log(`\nDescription Statistics:`);
    console.log(`- With Description: ${withDescription} (${((withDescription / data.length) * 100).toFixed(1)}%)`);
    console.log(`- Without Description: ${data.length - withDescription} (${(((data.length - withDescription) / data.length) * 100).toFixed(1)}%)`);

    // Sample data
    console.log(`\nSample Type Coupons:`);
    data.slice(0, 5).forEach((tc: any) => {
      console.log(`- ${tc.type_coupon_name} [${tc.record_status}]`);
      if (tc.type_coupon_desc) {
        console.log(`  "${tc.type_coupon_desc}"`);
      }
    });
  }

  process.exit(0);
}

main();