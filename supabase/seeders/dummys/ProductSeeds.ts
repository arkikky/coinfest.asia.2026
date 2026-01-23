import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gfohembnkqffkzzcdptj.supabase.co";
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2hlbWJua3FmZmt6emNkcHRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcwMzYwMCwiZXhwIjoyMDc5Mjc5NjAwfQ.8iaspyGv0nZDCZR5vUlq9P5c7Q_MdWSzmPgHiZ-Fb7A";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

type RecordStatus = "draft" | "published";

const DEFAULT_USER_ID = "4675f1dc-a1f6-48e6-8c36-51ecce5813d6";

// Event IDs yang akan digunakan
const EVENT_IDS = [
  "cdfde64e-f9a7-42b7-bc48-165cb57ca5cc",
  "405dbb02-a4a4-43c1-8156-09e915adb78a",
  "c1919043-2c56-4751-a5cc-515dc7189934",
];

// Contoh UUID dari tabel type_products
// Ganti dengan ID yang benar-benar ada di tabel type_products kamu!
const TYPE_PRODUCT_IDS = [
  "f17e2ff1-5a26-459a-8770-655bcc7a62a6",
  "e57e4a3f-9061-4853-bdac-23de202a83dc",
  "4e35bdc1-e043-4a7c-9696-1f8a41f05adb",
];

const VARIANTS = ["#000000"];

const SALE_BANNER_LABELS = [
  "SUPER EARLY BIRD SAVE 50%",
  "FLASH SALE – 40% OFF!",
  "LIMITED STOCK – 30% DISCOUNT",
  "PRE-ORDER SPECIAL – SAVE 35%",
  "HOT DEAL – ONLY TODAY!",
  "GROUP BUY – EXTRA 20% OFF",
  "LAST CHANCE – CLEARANCE SALE",
  "NEW LAUNCH – EXCLUSIVE PRICE",
];

function getRandomStatus(): RecordStatus {
  const statuses: RecordStatus[] = ["draft", "published"];
  return faker.helpers.arrayElement(statuses);
}

function generateProductId(): string {
  return `PRD-${faker.string.numeric(11)}`;
}

function createFakeProduct(eventId: string) {
  const price = parseFloat(faker.commerce.price({ min: 10000, max: 5000000 }));
  const isSaleActive = faker.datatype.boolean({ probability: 0.3 });
  const priceSale = isSaleActive
    ? price * faker.number.float({ min: 0.5, max: 0.9 })
    : null;

  const saleStart = isSaleActive ? faker.date.recent({ days: 30 }) : null;
  const saleEnd = saleStart
    ? faker.date.soon({ days: 60, refDate: saleStart })
    : null;

  return {
    id_events: eventId,
    id_type_products: faker.helpers.arrayElement(TYPE_PRODUCT_IDS), // ← BARU: wajib diisi
    product_id: generateProductId(),
    product_name: faker.commerce.productName(),
    product_description: faker.commerce.productDescription(),
    price: price.toFixed(1),
    price_sale: priceSale ? priceSale.toFixed(1) : null,
    product_stock: faker.number.int({ min: 0, max: 500 }),
    variant_product: faker.helpers.arrayElement([...VARIANTS, null]),
    is_group: faker.datatype.boolean({ probability: 0.2 }),
    is_sale_active: isSaleActive,
    sale_start: saleStart ? saleStart.toISOString() : null,
    sale_end: saleEnd ? saleEnd.toISOString() : null,
    sale_banner_label: isSaleActive
      ? faker.helpers.arrayElement(SALE_BANNER_LABELS)
      : null, // lebih baik null daripada string "null"
    created_by: DEFAULT_USER_ID,
    updated_by: DEFAULT_USER_ID,
    rank_record: faker.number.int({ min: 0, max: 100 }),
    record_status: getRandomStatus(),
  };
}

async function main() {
  console.log("Generating fake products...");
  console.log(`Event IDs: ${EVENT_IDS.join(", ")}`);
  console.log(`Type Product IDs count: ${TYPE_PRODUCT_IDS.length}`);

  const totalProducts = 20;
  const products = Array.from({ length: totalProducts }, () => {
    const randomEventId = faker.helpers.arrayElement(EVENT_IDS);
    return createFakeProduct(randomEventId);
  });

  console.log(`Inserting ${products.length} products into public.products...`);

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert(products)
    .select("id_products, product_name, price, id_events, id_type_products");

  if (error) {
    console.error("Error inserting products:", error);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data?.length ?? 0} products`);

  if (data && data.length > 0) {
    // Distribusi per event
    const eventDistribution = EVENT_IDS.map((eventId) => {
      const count = data.filter((p: any) => p.id_events === eventId).length;
      return { eventId, count };
    });

    console.log("\nDistribution per event:");
    eventDistribution.forEach((d) => {
      console.log(`- Event ${d.eventId.slice(0, 8)}...: ${d.count} products`);
    });

    // Distribusi per type product (opsional, berguna untuk debugging)
    const typeDistribution = TYPE_PRODUCT_IDS.map((typeId) => {
      const count = data.filter(
        (p: any) => p.id_type_products === typeId
      ).length;
      return { typeId: typeId.slice(0, 8), count };
    }).filter((t) => t.count > 0);

    console.log("\nDistribution per product type:");
    typeDistribution.forEach((t) => {
      console.log(`- Type ${t.typeId}...: ${t.count} products`);
    });

    // Sample products
    console.log("\nSample products:");
    data.slice(0, 7).forEach((p: any) => {
      console.log(
        `- ${p.product_name} (Rp${parseFloat(p.price).toLocaleString("id-ID")}) ` +
          `- Type: ${p.id_type_products.slice(0, 8)}... ` +
          `- Event: ${p.id_events.slice(0, 8)}...`
      );
    });
  }

  process.exit(0);
}

main().catch(console.error);
