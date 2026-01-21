import type { FormOption } from "@/types/hubspots/form.types";

// @constants(hubspot)
export const HUBSPOT_FORM_ID = "d37a45c6-8478-43db-b178-c13397afff13";
export const HUBSPOT_API_URL = "https://api.hubapi.com/marketing/v3/forms";

// @constants(cache)
export const CACHE_KEYS = {
  FIELDS:
    "what_type_of_connections_and_networking_do_you_hope_to_achieve_at_coinfest_asia_cache",
} as const;

export const CACHE_DURATION = {
  ONE_HOUR: 1000 * 60 * 60,
  ONE_DAY: 1000 * 60 * 60 * 24,
} as const;

// @fallback(company size options)
export const FALLBACK_OPTIONS: FormOption[] = [
  {
    value: "Funding companies and gain funds for my project",
    label: "Funding companies and gain funds for my project",
  },
  {
    value: "Founders of projects built in Web3",
    label: "Founders of projects built in Web3",
  },
  {
    value: "Potential business partners for my company",
    label: "Potential business partners for my company",
  },
  {
    value: "Infrastructure solutions to scale",
    label: "Infrastructure solutions to scale",
  },
  {
    value: "NFT creators and collectors",
    label: "NFT creators and collectors",
  },
  {
    value: "Community leaders to acquire users for my project",
    label: "Community leaders to acquire users for my project",
  },
  {
    value: "Fellow Web3 enthusiasts to exchange insights",
    label: "Fellow Web3 enthusiasts to exchange insights",
  },
];
