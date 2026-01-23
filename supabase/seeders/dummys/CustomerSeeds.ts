import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gfohembnkqffkzzcdptj.supabase.co";
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2hlbWJua3FmZmt6emNkcHRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcwMzYwMCwiZXhwIjoyMDc5Mjc5NjAwfQ.8iaspyGv0nZDCZR5vUlq9P5c7Q_MdWSzmPgHiZ-Fb7A";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

type RecordStatus = "draft" | "published" | "archived";

const DEFAULT_USER_ID = "4675f1dc-a1f6-48e6-8c36-51ecce5813d6";

// Event IDs yang akan digunakan
const EVENT_IDS = [
  "cdfde64e-f9a7-42b7-bc48-165cb57ca5cc",
  "405dbb02-a4a4-43c1-8156-09e915adb78a",
  "c1919043-2c56-4751-a5cc-515dc7189934",
];

function getRandomStatus(): RecordStatus {
  const statuses: RecordStatus[] = ["draft", "published"];
  return faker.helpers.arrayElement(statuses);
}

function generateBillingId(): string {
  return `C-${faker.string.numeric(13)}`;
}

function createFakeCustomer(eventId: string) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const fullName = `${firstName} ${lastName}`;
  const companyName = faker.company.name();

  // 70% chance memiliki company
  const hasCompany = faker.datatype.boolean({ probability: 0.7 });

  // 80% chance memiliki email
  const hasEmail = faker.datatype.boolean({ probability: 0.8 });

  // 60% chance sudah approved
  const isApproved = faker.datatype.boolean({ probability: 0.6 });

  return {
    id_events: eventId,
    billing_id: generateBillingId(),
    billing_name: fullName,
    billing_email: hasEmail
      ? faker.internet.email({ firstName, lastName }).toLowerCase()
      : null,
    billing_company: hasCompany ? companyName : null,
    billing_country: faker.location.country(),
    billing_website_url: hasCompany ? faker.internet.url() : null,
    is_approved: isApproved,
    created_by: DEFAULT_USER_ID,
    updated_by: DEFAULT_USER_ID,
    rank_record: faker.number.int({ min: 0, max: 100 }),
    record_status: getRandomStatus(),
  };
}

async function main() {
  console.log("Using predefined event IDs...");
  console.log(`Event IDs: ${EVENT_IDS.join(", ")}`);

  const totalCustomers = 1860;
  const customers = Array.from({ length: totalCustomers }, () => {
    // Pilih random event dari 3 event ID
    const randomEventId = faker.helpers.arrayElement(EVENT_IDS);
    return createFakeCustomer(randomEventId);
  });

  console.log(`Inserting ${customers.length} customers...`);

  const { data, error } = await supabaseAdmin
    .from("customers")
    .insert(customers)
    .select(
      "id_customers, billing_name, billing_email, billing_company, is_approved, id_events"
    );

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data?.length ?? 0} customers`);

  // Hitung distribusi per event
  if (data && data.length > 0) {
    const distribution = EVENT_IDS.map((eventId) => {
      const count = data.filter((c: any) => c.id_events === eventId).length;
      return { eventId, count };
    });

    console.log("\nDistribution per event:");
    distribution.forEach((d) => {
      console.log(`- Event ${d.eventId.slice(0, 8)}...: ${d.count} customers`);
    });

    // Statistik approval
    const approvedCount = data.filter((c: any) => c.is_approved).length;
    console.log(`\nApproval Statistics:`);
    console.log(
      `- Approved: ${approvedCount} (${((approvedCount / data.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `- Pending: ${data.length - approvedCount} (${(((data.length - approvedCount) / data.length) * 100).toFixed(1)}%)`
    );

    // Statistik company
    const withCompany = data.filter(
      (c: any) => c.billing_company !== null
    ).length;
    console.log(`\nCompany Statistics:`);
    console.log(
      `- With Company: ${withCompany} (${((withCompany / data.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `- Individual: ${data.length - withCompany} (${(((data.length - withCompany) / data.length) * 100).toFixed(1)}%)`
    );
  }

  process.exit(0);
}

main();
