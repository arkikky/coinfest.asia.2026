import type { FormOption } from "@/types/hubspots/form.types";

// @constants(hubspot)
export const HUBSPOT_FORM_ID = "d37a45c6-8478-43db-b178-c13397afff13";
export const HUBSPOT_API_URL = "https://api.hubapi.com/marketing/v3/forms";

// @constants(cache)
export const CACHE_KEYS = {
  FIELDS: "where_did_you_hear_about_coinfest_asia_2024_cache",
} as const;

export const CACHE_DURATION = {
  ONE_HOUR: 1000 * 60 * 60,
  ONE_DAY: 1000 * 60 * 60 * 24,
} as const;

// @fallback(company size options)
export const FALLBACK_OPTIONS: FormOption[] = [
  {
    value: "Attended last year",
    label: "Attended last year",
  },
  {
    value: "Search engine / Website",
    label: "Search engine / Website",
  },
  {
    value: "Email newsletter",
    label: "Email newsletter",
  },
  {
    value: "Social media (Twitter, Linkedin, Instagram, etc)",
    label: "Social media (Twitter, Linkedin, Instagram, etc)",
  },
  {
    value: "Telegram channel / group",
    label: "Telegram channel / group",
  },
  {
    value: "Offline ads",
    label: "Offline ads",
  },
  {
    value: "Coinfest official partners (Sponsor, Media, Community, etc)",
    label: "Coinfest official partners (Sponsor, Media, Community, etc)",
  },
  {
    value: "News from media site",
    label: "News from media site",
  },
  {
    value: "Word of mouth",
    label: "Word of mouth",
  },
];
