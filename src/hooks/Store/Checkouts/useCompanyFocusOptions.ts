"use client";
import { useFormFieldOptions } from "@/hooks/hubspots/useFormFieldOptions";
import {
  CACHE_KEYS,
  FALLBACK_OPTIONS,
} from "@/constants/hubspots/companyfocus.constants";

// @hook(company size options)
export function useCompanyFocusOptions() {
  return useFormFieldOptions({
    fieldName: "company_focus",
    apiEndpoint: "/api/v1/store/company-focus",
    cacheKey: CACHE_KEYS?.FIELDS,
    fallbackOptions: FALLBACK_OPTIONS,
  });
}
