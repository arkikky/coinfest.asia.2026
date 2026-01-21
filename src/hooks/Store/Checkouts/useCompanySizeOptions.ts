"use client";
import { useFormFieldOptions } from "@/hooks/hubspots/useFormFieldOptions";
import {
  CACHE_KEYS,
  FALLBACK_OPTIONS,
} from "@/constants/hubspots/form.constants";

// @hook(company size options)
export function useCompanySizeOptions() {
  return useFormFieldOptions({
    fieldName: "company_size",
    apiEndpoint: "/api/v1/store/company-size",
    cacheKey: CACHE_KEYS?.FIELDS,
    fallbackOptions: FALLBACK_OPTIONS,
  });
}
