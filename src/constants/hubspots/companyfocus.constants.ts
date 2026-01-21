import type { FormOption } from "@/types/hubspots/form.types";

// @constants(hubspot)
export const HUBSPOT_FORM_ID = "d37a45c6-8478-43db-b178-c13397afff13";
export const HUBSPOT_API_URL = "https://api.hubapi.com/marketing/v3/forms";

// @constants(cache)
export const CACHE_KEYS = {
  FIELDS: "company_focus_caches",
} as const;

export const CACHE_DURATION = {
  ONE_HOUR: 1000 * 60 * 60,
  ONE_DAY: 1000 * 60 * 60 * 24,
} as const;

// @fallback(company size options)
export const FALLBACK_OPTIONS: FormOption[] = [
  {
    value: "Administration, Legal",
    label: "Administration, Legal",
  },
  {
    value: "AI",
    label: "AI",
  },
  {
    value: "Association, Government Body",
    label: "Association, Government Body",
  },
  {
    value: "Banking, Payments",
    label: "Banking, Payments",
  },
  {
    value: "Cloud Infrastructure",
    label: "Cloud Infrastructure",
  },
  {
    value: "Community",
    label: "Community",
  },
  {
    value: "Consulting",
    label: "Consulting",
  },
  {
    value: "Consumer Goods",
    label: "Consumer Goods",
  },
  {
    value: "Consumer Tech (Web2)",
    label: "Consumer Tech (Web2)",
  },
  {
    value: "Creative, Entertainment, Art, Music, Sport",
    label: "Creative, Entertainment, Art, Music, Sport",
  },
  {
    value: "DAO",
    label: "DAO",
  },
  {
    value: "DeFi (Staking, Lending, Farming, Trading)",
    label: "DeFi (Staking, Lending, Farming, Trading)",
  },
  {
    value: "EdTech",
    label: "EdTech",
  },
  {
    value: "Events",
    label: "Events",
  },
  {
    value: "Exchange (CX, DX, Aggregator)",
    label: "Exchange (CX, DX, Aggregator)",
  },
  {
    value: "GameFi, Game",
    label: "GameFi, Game",
  },
  {
    value: "Hedge Fund, Market Maker, Trading Desk, OTC Desk",
    label: "Hedge Fund, Market Maker, Trading Desk, OTC Desk",
  },
  {
    value: "Identity Infrastructure",
    label: "Identity Infrastructure",
  },
  {
    value: "Intelligence, Analysis, Statistics",
    label: "Intelligence, Analysis, Statistics",
  },
  {
    value: "Launchpad",
    label: "Launchpad",
  },
  {
    value: "Marketplace, E-Commerce",
    label: "Marketplace, E-Commerce",
  },
  {
    value:
      "Media, Marketing Agency, Advertising Agency, Public Relations Agency",
    label:
      "Media, Marketing Agency, Advertising Agency, Public Relations Agency",
  },
  {
    value: "Metaverse",
    label: "Metaverse",
  },
  {
    value: "Mining",
    label: "Mining",
  },
  {
    value: "NFT",
    label: "NFT",
  },
  {
    value: "Protocol (L1,L2)",
    label: "Protocol (L1,L2)",
  },
  {
    value: "Real World Assets (RWA)",
    label: "Real World Assets (RWA)",
  },
  {
    value: "Security",
    label: "Security",
  },
  {
    value: "Social App",
    label: "Social App",
  },
  {
    value: "Software Development, Development House",
    label: "Software Development, Development House",
  },
  {
    value: "Staking Infrastructure",
    label: "Staking Infrastructure",
  },
  {
    value: "Stealth (I do not want to reveal my company focus)",
    label: "Stealth (I do not want to reveal my company focus)",
  },
  {
    value: "Telco",
    label: "Telco",
  },
  {
    value: "Trading Infrastructure",
    label: "Trading Infrastructure",
  },
  {
    value: "Travel",
    label: "Travel",
  },
  {
    value: "University",
    label: "University",
  },
  {
    value: "Venture Builder, Accelerator",
    label: "Venture Builder, Accelerator",
  },
  {
    value: "Venture Capital, Fund, Private Equity, Angel Investor",
    label: "Venture Capital, Fund, Private Equity, Angel Investor",
  },
  {
    value: "Wallet Infrastructure (Wallet, Custodian Solution)",
    label: "Wallet Infrastructure (Wallet, Custodian Solution)",
  },
  {
    value: "Web Hosting",
    label: "Web Hosting",
  },
  {
    value: "Other",
    label: "Other",
  },
];
