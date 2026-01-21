import type { FormOption } from "@/types/hubspots/form.types";

// @constants(hubspot)
export const HUBSPOT_FORM_ID = "d37a45c6-8478-43db-b178-c13397afff13";
export const HUBSPOT_API_URL = "https://api.hubapi.com/marketing/v3/forms";

// @constants(cache)
export const CACHE_KEYS = {
  FIELDS: "company_size_options_cache",
} as const;

export const CACHE_DURATION = {
  ONE_HOUR: 1000 * 60 * 60,
  ONE_DAY: 1000 * 60 * 60 * 24,
} as const;

// @fallback(company size options)
export const FALLBACK_OPTIONS: FormOption[] = [
  {
    value: "Individual",
    label: "Individual",
  },
  {
    value: "1-10 employees",
    label: "1-10 employees",
  },
  {
    value: "11-50 employees",
    label: "11-50 employees",
  },
  {
    value: "51-250 employees",
    label: "51-250 employees",
  },
  {
    value: "251-500 employees",
    label: "251-500 employees",
  },
  {
    value: "501-1,000 employees",
    label: "501-1,000 employees",
  },
  {
    value: ">1,000 employees",
    label: ">1,000 employees",
  },
  {
    value: "N/A Im a Student",
    label: "N/A, I'm a Student",
  },
];
