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

function generateAttendeeId(): string {
  return `A-${faker.string.alphanumeric(13).toUpperCase()}`;
}

function generateSocialAccounts() {
  const socialTypes = ["twitter", "linkedin", "facebook", "instagram"];
  const numAccounts = faker.number.int({ min: 0, max: 3 });

  if (numAccounts === 0) return null;

  const accounts = [];
  const selectedTypes = faker.helpers.arrayElements(socialTypes, numAccounts);

  for (const type of selectedTypes) {
    accounts.push({
      type,
      url: `https://${type}.com/${faker.internet.username()}`,
    });
  }

  return accounts;
}

function generateCustomQuestions() {
  const questions = [
    "where_did_you_hear_about_coinfest_asia_2025?",
    "what_type_of_connections_and_networking_do_you_hope_to_achieve_at_the_event?",
  ];

  const numQuestions = faker.number.int({ min: 0, max: 2 });

  if (numQuestions === 0) return null;

  const selectedQuestions = faker.helpers.arrayElements(
    questions,
    numQuestions
  );

  return selectedQuestions.map((question) => ({
    question,
    answer: faker.lorem.sentence(),
  }));
}

function createFakeAttendee(eventId: string) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const companyName = faker.company.name();

  // 70% chance memiliki company
  const hasCompany = faker.datatype.boolean({ probability: 0.7 });

  // 80% chance memiliki email
  const hasEmail = faker.datatype.boolean({ probability: 0.8 });

  // 60% chance sudah approved
  const isApproved = faker.datatype.boolean({ probability: 0.6 });

  // 30% chance adalah customer (memiliki id_customers)
  const isCustomer = faker.datatype.boolean({ probability: 0.3 });

  // 20% chance sudah self-edited
  const selfEdited = faker.datatype.boolean({ probability: 0.2 });

  const companySizes = [
    "1-10",
    "11-50",
    "51-200",
    "201-500",
    "501-1000",
    "1000+",
  ];
  const positions = [
    "Manager",
    "Director",
    "CEO",
    "CTO",
    "Developer",
    "Designer",
    "Analyst",
    "Consultant",
  ];
  const customers = [
    "952cfd2f-f876-4627-b8c0-45fb46762b34",
    "4e7e0d23-7994-43a7-ab43-55d78ba1f9e4",
  ];

  return {
    id_events: eventId,
    id_customers: faker.helpers.arrayElement(customers),
    attendee_id: generateAttendeeId(),
    first_name: firstName,
    last_name: lastName,
    email: hasEmail
      ? faker.internet.email({ firstName, lastName }).toLowerCase()
      : null,
    country: faker.location.country(),
    position: hasCompany ? faker.helpers.arrayElement(positions) : null,
    company_name: hasCompany ? companyName : null,
    company_focus: hasCompany ? faker.company.buzzPhrase() : null,
    company_size: hasCompany ? faker.helpers.arrayElement(companySizes) : null,
    social_accounts: generateSocialAccounts(),
    custom_questions: generateCustomQuestions(),
    self_edited: selfEdited,
    is_customer: isCustomer,
    is_approved: isApproved,
    approved_at: isApproved
      ? faker.date.recent({ days: 30 }).toISOString()
      : null,
    created_by: DEFAULT_USER_ID,
    updated_by: DEFAULT_USER_ID,
    rank_record: faker.number.int({ min: 0, max: 100 }),
    record_status: getRandomStatus(),
  };
}

async function main() {
  console.log("Using predefined event IDs...");
  console.log(`Event IDs: ${EVENT_IDS.join(", ")}`);

  const totalAttendees = 5060;
  const attendees = Array.from({ length: totalAttendees }, () => {
    const randomEventId = faker.helpers.arrayElement(EVENT_IDS);
    return createFakeAttendee(randomEventId);
  });

  console.log(`Inserting ${attendees.length} attendees...`);

  const { data, error } = await supabaseAdmin
    .from("attendee")
    .insert(attendees)
    .select(
      "id_attendee, first_name, last_name, email, company_name, is_approved, is_customer, id_events"
    );

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data?.length ?? 0} attendees`);

  // Hitung distribusi per event
  if (data && data.length > 0) {
    const distribution = EVENT_IDS.map((eventId) => {
      const count = data.filter((a: any) => a.id_events === eventId).length;
      return { eventId, count };
    });

    console.log("\nDistribution per event:");
    distribution.forEach((d) => {
      console.log(`- Event ${d.eventId.slice(0, 8)}...: ${d.count} attendees`);
    });

    // Statistik approval
    const approvedCount = data.filter((a: any) => a.is_approved).length;
    console.log(`\nApproval Statistics:`);
    console.log(
      `- Approved: ${approvedCount} (${((approvedCount / data.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `- Pending: ${data.length - approvedCount} (${(((data.length - approvedCount) / data.length) * 100).toFixed(1)}%)`
    );

    // Statistik company
    const withCompany = data.filter((a: any) => a.company_name !== null).length;
    console.log(`\nCompany Statistics:`);
    console.log(
      `- With Company: ${withCompany} (${((withCompany / data.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `- Individual: ${data.length - withCompany} (${(((data.length - withCompany) / data.length) * 100).toFixed(1)}%)`
    );

    // Statistik customer
    const customerCount = data.filter((a: any) => a.is_customer).length;
    console.log(`\nCustomer Statistics:`);
    console.log(
      `- Is Customer: ${customerCount} (${((customerCount / data.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `- Non-Customer: ${data.length - customerCount} (${(((data.length - customerCount) / data.length) * 100).toFixed(1)}%)`
    );
  }

  process.exit(0);
}

main();
