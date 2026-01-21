"use client";
import { useFormFieldOptions } from "@/hooks/hubspots/useFormFieldOptions";
import {
  CACHE_KEYS,
  FALLBACK_OPTIONS,
} from "@/constants/hubspots/companyposition.constants";

// @hook(company size options)
export function useCompanyPositionOptions() {
  return useFormFieldOptions({
    fieldName: "job_title_position",
    apiEndpoint: "/api/v1/store/company-position",
    cacheKey: CACHE_KEYS?.FIELDS,
    fallbackOptions: FALLBACK_OPTIONS,
  });
}
