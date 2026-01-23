import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gfohembnkqffkzzcdptj.supabase.co";
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2hlbWJua3FmZmt6emNkcHRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcwMzYwMCwiZXhwIjoyMDc5Mjc5NjAwfQ.8iaspyGv0nZDCZR5vUlq9P5c7Q_MdWSzmPgHiZ-Fb7A";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Types
type RecordStatus = "draft" | "published" | "archived";
type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded";
type OrderMerchant = "online" | "offline";

const DEFAULT_USER_ID = "4675f1dc-a1f6-48e6-8c36-51ecce5813d6";

const EVENT_IDS = [
  "cdfde64e-f9a7-42b7-bc48-165cb57ca5cc",
  "405dbb02-a4a4-43c1-8156-09e915adb78a",
  "c1919043-2c56-4751-a5cc-515dc7189934",
];

// ✅ Attendee IDs yang akan digunakan
const ATTENDEE_IDS = [
  "8c24d8b4-e110-42c4-834f-857ebec4700c",
  "482f59ce-ab40-4ccf-810f-ab79e4cefcac",
  "944f0520-5a2a-4e4f-888a-7e663838ae87",
  "1808b774-0f99-4ec5-98e7-82df31fa6c9a",
  "9629bf6b-7fb7-4573-8fc9-62f0f83ba795",
  "866cbe70-75d5-4654-a800-ea7db4316a80",
  "7a0ac618-8268-401a-ac7e-b3c773ebf852",
  "eeca5f22-696e-4240-a4d3-cbbf5506777e",
  "8af07641-cc6c-461e-a90b-088156d6faa7",
  "65ff454d-4126-45ba-a016-6fb2fac3a1dc",
];

// ⚠️ GANTI INI dengan UUID type_products "ticket" yang REAL dari database Anda!
const TICKET_TYPE_PRODUCT_IDS = [
  "e57e4a3f-9061-4853-bdac-23de202a83dc",
  "4e35bdc1-e043-4a7c-9696-1f8a41f05adb",
];

function weightedPick<T>(options: { weight: number; value: T }[]): T {
  return faker.helpers.weightedArrayElement(options);
}

async function fetchExistingData() {
  console.log("Fetching existing data from database...");

  const [customers, products, coupons] = await Promise.all([
    supabaseAdmin.from("customers").select("id_customers").limit(300),
    supabaseAdmin
      .from("products")
      .select("id_products, id_type_products, price, price_sale")
      .limit(200),
    supabaseAdmin.from("coupons").select("id_coupons").limit(100),
  ]);

  if (customers.error || !customers.data || customers.data.length < 10) {
    throw new Error(
      "Not enough customers in database. Run customer seeder first."
    );
  }
  if (products.error || !products.data || products.data.length < 5) {
    throw new Error("Not enough products. Run product seeder first.");
  }

  const customerIds = customers.data.map((c: any) => c.id_customers);
  const productList = products.data;
  const couponIds = coupons.data?.map((c: any) => c.id_coupons) || [];

  // ✅ Log info tentang ticket products
  const ticketProducts = productList.filter((p) =>
    TICKET_TYPE_PRODUCT_IDS.includes(p.id_type_products)
  );

  console.log(
    `✅ Loaded: ${customerIds.length} customers, ${productList.length} products`
  );
  console.log(`✅ Using ${ATTENDEE_IDS.length} hardcoded attendee IDs`);
  console.log(`🎟️  Found ${ticketProducts.length} ticket products in database`);

  if (ticketProducts.length === 0) {
    console.warn(
      "⚠️  WARNING: No ticket products found! Check TICKET_TYPE_PRODUCT_IDS"
    );
  }

  return { customerIds, productList, couponIds };
}

function generateOrderId(): string {
  return `ORD-${faker.string.alphanumeric(10).toUpperCase()}`;
}

// ✅ Struktur data yang lebih terorganisir
interface OrderData {
  orderRecord: any;
  items: Array<{
    itemRecord: any;
    attendeeAssignments: any[];
    isTicket: boolean; // ✅ Flag untuk tracking
  }>;
}

async function main() {
  console.log("🚀 Starting comprehensive order seeding...\n");

  const { customerIds, productList, couponIds } = await fetchExistingData();

  const totalOrders = 5;
  const ordersData: OrderData[] = [];

  // ✅ GENERATE SEMUA DATA DENGAN STRUKTUR YANG JELAS
  for (let i = 0; i < totalOrders; i++) {
    const eventId = faker.helpers.arrayElement(EVENT_IDS);
    const customerId = faker.helpers.arrayElement(customerIds);
    const useCoupon =
      faker.datatype.boolean({ probability: 0.3 }) && couponIds.length > 0;
    const couponId = useCoupon ? faker.helpers.arrayElement(couponIds) : null;

    const merchant = weightedPick<OrderMerchant>([
      { weight: 85, value: "online" },
      { weight: 15, value: "offline" },
    ]);

    const paymentStatus = weightedPick<PaymentStatus>([
      { weight: 30, value: "pending" },
      { weight: 55, value: "paid" },
      { weight: 10, value: "failed" },
      { weight: 5, value: "cancelled" },
    ]);

    const numItems = faker.number.int({ min: 1, max: 5 });
    const selectedProducts = faker.helpers.arrayElements(productList, numItems);

    let subtotal = 0;
    const itemsForThisOrder: OrderData["items"] = [];

    for (const prod of selectedProducts) {
      const maxQty = merchant === "offline" ? 15 : 4;
      const quantity = faker.number.int({ min: 1, max: maxQty });

      const unitPrice =
        prod.price_sale && faker.datatype.boolean({ probability: 0.7 })
          ? parseFloat(prod.price_sale)
          : parseFloat(prod.price);

      const itemSubtotal = quantity * unitPrice;
      subtotal += itemSubtotal;

      const itemRecord = {
        id_products: prod.id_products,
        quantity,
        subtotal: itemSubtotal.toFixed(2),
        metadata: faker.datatype.boolean(0.1)
          ? { customer_note: faker.lorem.sentence() }
          : {},
        created_by: DEFAULT_USER_ID,
        updated_by: DEFAULT_USER_ID,
        rank_record: faker.number.int({ min: 0, max: 50 }),
        record_status: "published" as RecordStatus,
      };

      // ✅ CEK apakah ini product ticket
      const isTicket = TICKET_TYPE_PRODUCT_IDS.includes(prod.id_type_products);
      const attendeeAssignments: any[] = [];

      // ✅ HANYA assign attendee jika product adalah ticket
      if (isTicket) {
        for (let q = 0; q < quantity; q++) {
          const attendeeId = faker.helpers.arrayElement(ATTENDEE_IDS);
          attendeeAssignments.push({
            id_attendee: attendeeId,
            created_by: DEFAULT_USER_ID,
            updated_by: DEFAULT_USER_ID,
            rank_record: faker.number.int({ min: 0, max: 50 }),
            record_status: "published" as RecordStatus,
          });
        }
      }

      itemsForThisOrder.push({
        itemRecord,
        attendeeAssignments,
        isTicket, // ✅ Simpan flag
      });
    }

    const discountAmount = useCoupon
      ? subtotal * faker.number.float({ min: 0.05, max: 0.35 })
      : 0;
    const grandTotal = Math.max(0, subtotal - discountAmount);

    const orderRecord = {
      id_events: eventId,
      id_customers: customerId,
      id_coupons: couponId,
      order_id: generateOrderId(),
      order_notes: faker.datatype.boolean(0.2) ? faker.lorem.sentence() : null,
      order_subtotal: subtotal.toFixed(2),
      discount_amount: discountAmount.toFixed(2),
      grand_order_total: grandTotal.toFixed(2),
      payment_method: faker.helpers.arrayElement([
        "credit_card",
        "bank_transfer",
        "ewallet",
        "crypto",
      ]),
      payment_provider: faker.helpers.arrayElement([
        "stripe",
        "xendit",
        "midtrans",
        null,
      ]),
      payment_status: paymentStatus,
      expired_at:
        paymentStatus === "pending"
          ? faker.date.soon({ days: 2 }).toISOString()
          : null,
      paid_at:
        paymentStatus === "paid"
          ? faker.date.recent({ days: 30 }).toISOString()
          : null,
      cancelled_at:
        paymentStatus === "cancelled"
          ? faker.date.recent({ days: 10 }).toISOString()
          : null,
      order_merchant: merchant,
      created_by: DEFAULT_USER_ID,
      updated_by: DEFAULT_USER_ID,
      rank_record: faker.number.int({ min: 0, max: 100 }),
      record_status: weightedPick([
        { weight: 80, value: "published" },
        { weight: 20, value: "draft" },
      ]) as RecordStatus,
    };

    ordersData.push({
      orderRecord,
      items: itemsForThisOrder,
    });

    if ((i + 1) % 25 === 0) {
      console.log(`Generated data for ${i + 1}/${totalOrders} orders...`);
    }
  }

  // ✅ 1. Insert orders
  console.log("\n📦 Inserting orders...");
  const ordersToInsert = ordersData.map((o) => o.orderRecord);
  const { data: insertedOrders, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert(ordersToInsert)
    .select("id_orders");

  if (orderError || !insertedOrders) {
    console.error("❌ Order insert failed:", orderError?.message);
    process.exit(1);
  }

  // ✅ 2. Insert order_items dengan id_orders yang benar
  console.log(`📄 Inserting order items...`);
  const allOrderItems: any[] = [];

  for (let i = 0; i < insertedOrders.length; i++) {
    const orderId = insertedOrders[i].id_orders;
    const orderData = ordersData[i];

    for (const itemData of orderData.items) {
      allOrderItems.push({
        ...itemData.itemRecord,
        id_orders: orderId,
      });
    }
  }

  console.log(`   Total order items to insert: ${allOrderItems.length}`);

  const { data: insertedItems, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .insert(allOrderItems)
    .select("id_order_items");

  if (itemsError || !insertedItems) {
    console.error("❌ Order items insert failed:", itemsError?.message);
    console.error("   Full error:", JSON.stringify(itemsError, null, 2));
    process.exit(1);
  }

  console.log(`   ✅ Inserted ${insertedItems.length} order items`);

  // ✅ 3. Insert order_item_attendees dengan mapping yang benar
  console.log(`\n🎟️ Processing attendee assignments...`);
  const allAttendeeAssignments: any[] = [];

  let itemIndex = 0;
  let ticketItemCount = 0;

  for (let i = 0; i < ordersData.length; i++) {
    const orderData = ordersData[i];

    for (const itemData of orderData.items) {
      const orderItemId = insertedItems[itemIndex].id_order_items;

      // ✅ Hanya proses jika item ini adalah ticket
      if (itemData.isTicket && itemData.attendeeAssignments.length > 0) {
        ticketItemCount++;

        for (const assignment of itemData.attendeeAssignments) {
          allAttendeeAssignments.push({
            ...assignment,
            id_order_items: orderItemId,
          });
        }
      }

      itemIndex++;
    }
  }

  console.log(`   Found ${ticketItemCount} ticket items`);
  console.log(
    `   Total attendee assignments to insert: ${allAttendeeAssignments.length}`
  );

  if (allAttendeeAssignments.length > 0) {
    const { error: attendeeError } = await supabaseAdmin
      .from("order_item_attendees")
      .insert(allAttendeeAssignments);

    if (attendeeError) {
      console.error("❌ Attendee insert error:", attendeeError.message);
      console.error("   Full error:", JSON.stringify(attendeeError, null, 2));
      console.error("\n   Sample data being inserted:");
      console.error(
        JSON.stringify(allAttendeeAssignments.slice(0, 3), null, 2)
      );
    } else {
      console.log("   ✅ Attendee assignments successful!");
    }
  } else {
    console.log("   ⚠️  No ticket products were purchased in any orders!");
    console.log(
      "   💡 Make sure TICKET_TYPE_PRODUCT_IDS matches actual type_products UUIDs in your database"
    );
  }

  console.log("\n🎉 SEEDING SELESAI!");
  console.log(`   Orders: ${insertedOrders.length}`);
  console.log(`   Order Items: ${insertedItems.length}`);
  console.log(`   Order Item Attendees: ${allAttendeeAssignments.length}`);

  // ✅ Verification query
  console.log("\n🔍 Verifying data...");
  const { data: verifyData, error: verifyError } = await supabaseAdmin
    .from("order_item_attendees")
    .select("id_order_item_attendees")
    .limit(5);

  if (verifyError) {
    console.error("   ⚠️  Could not verify:", verifyError.message);
  } else if (verifyData && verifyData.length > 0) {
    console.log(
      `   ✅ Confirmed: ${verifyData.length} sample records exist in database`
    );
  } else {
    console.log("   ⚠️  No records found in order_item_attendees table");
  }
}

main().catch((err) => {
  console.error("💥 Unexpected error:", err);
  process.exit(1);
});
