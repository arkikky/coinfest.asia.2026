import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gfohembnkqffkzzcdptj.supabase.co";
const supabaseServiceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmb2hlbWJua3FmZmt6emNkcHRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzcwMzYwMCwiZXhwIjoyMDc5Mjc5NjAwfQ.8iaspyGv0nZDCZR5vUlq9P5c7Q_MdWSzmPgHiZ-Fb7A";

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

type EventRecordStatus = "draft" | "published" | "archived";

const DEFAULT_USER_ID = "4675f1dc-a1f6-48e6-8c36-51ecce5813d6";

function getRandomStatus(): EventRecordStatus {
  const statuses: EventRecordStatus[] = [
    "draft",
    "published",
  ];
  return faker.helpers.arrayElement(statuses);
}

function createFakeEvent() {
  const start = faker.date.between({
    from: new Date("2024-01-01"),
    to: new Date("2025-12-31"),
  });

  const end = faker.date.soon({ days: 2, refDate: start });

  return {
    event_thumbnail_url_image: faker.image.urlPicsumPhotos({
      width: 800,
      height: 400,
    }),
    event_name: faker.company.catchPhrase(),
    event_description: faker.lorem.paragraphs({ min: 1, max: 3 }),
    event_location: `${faker.location.city()}`,
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    website_url: faker.internet.url(),
    rank_record: faker.number.int({ min: 0, max: 100 }),
    record_status: getRandomStatus(),
    created_by: DEFAULT_USER_ID,
    updated_by: null,
  };
}

async function main() {
  const total = 100;
  const events = Array.from({ length: total }, () => createFakeEvent());

  const { data, error } = await supabaseAdmin
    .from("events")
    .insert(events)
    .select("id_events, event_name");

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log(`Inserted ${data?.length ?? 0} events`);
  process.exit(0);
}

main();
