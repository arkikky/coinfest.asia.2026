import type { SingleAttendee } from "@/schema/store/attendee.schema";

// @default(empty attendee)
export const emptyAttendee: SingleAttendee = {
  first_name: "",
  last_name: "",
  email: "",
  country: "",
  social_accounts: [],
  custom_questions: [
    {
      question:
        "What type of connections and networking do you hope to achieve at the event?",
      answer: "",
    },
    {
      question: "Where did you hear about Coinfest Asia 2025?",
      answer: "",
    },
  ],
  is_working_with_company: false,
  company_name: "N/A",
  position: "N/A",
  company_website: "N/A",
  company_focus: "N/A",
  company_size: "N/A",
};

// @constants(copyable fields)
export const COPYABLE_ATTENDEE_FIELDS = [
  "country",
  "company_name",
  "company_website",
  "position",
  "company_focus",
  "company_size",
] as const;

// @constants(social media platforms)
export const SOCIAL_MEDIA_PLATFORMS = [
  { value: "telegram", label: "Telegram" },
  { value: "twitter", label: "Twitter" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
] as const;

// @constants(custom questions)
export const DEFAULT_CUSTOM_QUESTIONS = [
  "What type of connections and networking do you hope to achieve at the event?",
  "Where did you hear about Coinfest Asia 2025?",
] as const;
