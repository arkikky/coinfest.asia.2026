import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gfohembnkqffkzzcdptj.supabase.co";
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2hlbWJua3FmZmt6emNkcHRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcwMzYwMCwiZXhwIjoyMDc5Mjc5NjAwfQ.8iaspyGv0nZDCZR5vUlq9P5c7Q_MdWSzmPgHiZ-Fb7A";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

type RecordStatus = "draft" | "published" | "archived";
type OrderPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";
type OrderMerchant = "online" | "offline";

const DEFAULT_USER_ID = "4675f1dc-a1f6-48e6-8c36-51ecce5813d6";

// Event IDs yang akan digunakan
const EVENT_IDS = [
  "cdfde64e-f9a7-42b7-bc48-165cb57ca5cc",
  "405dbb02-a4a4-43c1-8156-09e915adb78a",
  "c1919043-2c56-4751-a5cc-515dc7189934",
];

// Customer IDs yang akan digunakan
const CUSTOMER_IDS = [
  "952cfd2f-f876-4627-b8c0-45fb46762b34",
  "4e7e0d23-7994-43a7-ab43-55d78ba1f9e4",
];

// Coupon IDs yang akan digunakan (optional)
const COUPON_IDS = [
  "bdf2505c-a38f-4ef5-a665-324cf3c176da",
  "2648e396-2cbc-4ca4-aca8-77a85ae3393b",
  "b834b63f-bbfe-434b-a011-aca801aa1af2",
];

function getRandomStatus(): RecordStatus {
  const statuses: RecordStatus[] = ["draft", "published", "archived"];
  return faker.helpers.arrayElement(statuses);
}

function getRandomPaymentStatus(): OrderPaymentStatus {
  // Distribusi yang lebih realistis
  const rand = Math.random();
  if (rand < 0.5) return "paid"; // 50%
  if (rand < 0.7) return "pending"; // 20%
  if (rand < 0.85) return "failed"; // 15%
  if (rand < 0.95) return "cancelled"; // 10%
  return "refunded"; // 5%
}

function getRandomMerchant(): OrderMerchant {
  const merchants: OrderMerchant[] = ["online", "offline"];
  // 80% online, 20% offline
  return faker.datatype.boolean({ probability: 0.8 }) ? "online" : "offline";
}

function generateOrderId(): string {
  return `ORD-${faker.string.alphanumeric(12).toUpperCase()}`;
}

function generatePaymentMethod(merchant: OrderMerchant): string {
  if (merchant === "offline") {
    return faker.helpers.arrayElement([
      "Cash",
      "Bank Transfer",
      "EDC BCA",
      "EDC Mandiri",
    ]);
  }

  return faker.helpers.arrayElement([
    "Credit Card",
    "Debit Card",
    "Virtual Account",
    "E-Wallet",
    "QRIS",
  ]);
}

function generatePaymentProvider(paymentMethod: string): string | null {
  if (paymentMethod === "Cash") return null;

  const providers: Record<string, string[]> = {
    "Credit Card": ["Visa", "Mastercard", "JCB"],
    "Debit Card": ["Visa Debit", "Mastercard Debit"],
    "Virtual Account": ["BCA VA", "Mandiri VA", "BNI VA", "BRI VA"],
    "E-Wallet": ["GoPay", "OVO", "Dana", "LinkAja"],
    QRIS: ["QRIS"],
    "Bank Transfer": ["BCA", "Mandiri", "BNI", "BRI"],
    "EDC BCA": ["BCA"],
    "EDC Mandiri": ["Mandiri"],
  };

  const availableProviders = providers[paymentMethod] || ["Unknown"];
  return faker.helpers.arrayElement(availableProviders);
}

function generatePaymentIntentId(
  paymentStatus: OrderPaymentStatus
): string | null {
  // Hanya generate jika online dan bukan pending
  if (paymentStatus === "pending") return null;

  return `pi_${faker.string.alphanumeric(24)}`;
}

function createFakeOrder(eventId: string) {
  const merchant = getRandomMerchant();
  const paymentStatus = getRandomPaymentStatus();

  // 60% chance menggunakan coupon
  const hasCoupon = faker.datatype.boolean({ probability: 0.6 });

  // 30% chance memiliki notes
  const hasNotes = faker.datatype.boolean({ probability: 0.3 });

  // Generate amounts
  const orderSubtotal = parseFloat(
    faker.number
      .float({ min: 50000, max: 5000000, fractionDigits: 2 })
      .toFixed(2)
  );

  const discountAmount = hasCoupon
    ? parseFloat(
        (
          orderSubtotal *
          faker.number.float({ min: 0.05, max: 0.3, fractionDigits: 2 })
        ).toFixed(2)
      )
    : 0;

  const grandOrderTotal = parseFloat(
    (orderSubtotal - discountAmount).toFixed(2)
  );

  const paymentMethod = generatePaymentMethod(merchant);
  const paymentProvider = generatePaymentProvider(paymentMethod);

  // Generate timestamps based on payment status
  const createdAt = faker.date.recent({ days: 90 });
  const expiredAt =
    paymentStatus === "pending"
      ? faker.date.soon({ days: 1, refDate: createdAt })
      : null;

  const paidAt =
    paymentStatus === "paid" || paymentStatus === "refunded"
      ? faker.date.soon({ days: 1, refDate: createdAt })
      : null;

  const cancelledAt =
    paymentStatus === "cancelled"
      ? faker.date.soon({ days: 2, refDate: createdAt })
      : null;

  const refundedAt =
    paymentStatus === "refunded" && paidAt
      ? faker.date.soon({ days: 7, refDate: paidAt })
      : null;

  return {
    id_events: eventId,
    id_customers: faker.helpers.arrayElement(CUSTOMER_IDS),
    id_coupons: hasCoupon ? faker.helpers.arrayElement(COUPON_IDS) : null,
    order_id: generateOrderId(),
    order_notes: hasNotes ? faker.lorem.sentences(2) : null,
    order_subtotal: orderSubtotal,
    discount_amount: discountAmount,
    grand_order_total: grandOrderTotal,
    payment_method: paymentMethod,
    payment_provider: paymentProvider,
    payment_intent_id: generatePaymentIntentId(paymentStatus),
    payment_status: paymentStatus,
    expired_at: expiredAt?.toISOString() || null,
    paid_at: paidAt?.toISOString() || null,
    cancelled_at: cancelledAt?.toISOString() || null,
    refunded_at: refundedAt?.toISOString() || null,
    created_by: DEFAULT_USER_ID,
    updated_by: DEFAULT_USER_ID,
    rank_record: faker.number.int({ min: 0, max: 100 }),
    order_merchant: merchant,
    record_status: getRandomStatus(),
  };
}

async function main() {
  console.log("Using predefined event IDs...");
  console.log(`Event IDs: ${EVENT_IDS.join(", ")}`);

  const totalOrders = 160;
  const orders = Array.from({ length: totalOrders }, () => {
    const randomEventId = faker.helpers.arrayElement(EVENT_IDS);
    return createFakeOrder(randomEventId);
  });

  console.log(`Inserting ${orders.length} orders...`);

  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert(orders)
    .select(
      "id_orders, order_id, payment_status, order_merchant, grand_order_total, id_events"
    );

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data?.length ?? 0} orders`);

  // Hitung distribusi per event
  if (data && data.length > 0) {
    const distribution = EVENT_IDS.map((eventId) => {
      const count = data.filter((o: any) => o.id_events === eventId).length;
      const revenue = data
        .filter(
          (o: any) => o.id_events === eventId && o.payment_status === "paid"
        )
        .reduce(
          (sum: number, o: any) => sum + parseFloat(o.grand_order_total),
          0
        );
      return { eventId, count, revenue };
    });

    console.log("\nDistribution per event:");
    distribution.forEach((d) => {
      console.log(
        `- Event ${d.eventId.slice(0, 8)}...: ${d.count} orders (Revenue: Rp ${d.revenue.toLocaleString("id-ID")})`
      );
    });

    // Statistik payment status
    const statusStats = {
      paid: data.filter((o: any) => o.payment_status === "paid").length,
      pending: data.filter((o: any) => o.payment_status === "pending").length,
      failed: data.filter((o: any) => o.payment_status === "failed").length,
      cancelled: data.filter((o: any) => o.payment_status === "cancelled")
        .length,
      refunded: data.filter((o: any) => o.payment_status === "refunded").length,
    };

    console.log(`\nPayment Status Statistics:`);
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(
        `- ${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} (${((count / data.length) * 100).toFixed(1)}%)`
      );
    });

    // Statistik merchant
    const onlineCount = data.filter(
      (o: any) => o.order_merchant === "online"
    ).length;
    const offlineCount = data.filter(
      (o: any) => o.order_merchant === "offline"
    ).length;
    console.log(`\nMerchant Statistics:`);
    console.log(
      `- Online: ${onlineCount} (${((onlineCount / data.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `- Offline: ${offlineCount} (${((offlineCount / data.length) * 100).toFixed(1)}%)`
    );

    // Total revenue
    const totalRevenue = data
      .filter((o: any) => o.payment_status === "paid")
      .reduce(
        (sum: number, o: any) => sum + parseFloat(o.grand_order_total),
        0
      );

    console.log(`\nRevenue Statistics:`);
    console.log(`- Total Paid Orders: ${statusStats.paid}`);
    console.log(`- Total Revenue: Rp ${totalRevenue.toLocaleString("id-ID")}`);
    console.log(
      `- Average Order Value: Rp ${(totalRevenue / statusStats.paid).toLocaleString("id-ID")}`
    );
  }

  process.exit(0);
}

main();
