"use client";
import { useFormFieldOptions } from "@/hooks/hubspots/useFormFieldOptions";
import {
  CACHE_KEYS,
  FALLBACK_OPTIONS,
} from "@/constants/hubspots/hearabout.constants";

// @hook(company size options)
export function useHearAboutOptions() {
  return useFormFieldOptions({
    fieldName: "where_did_you_hear_about_coinfest_asia_2024_",
    apiEndpoint: "/api/v1/store/hear-about",
    cacheKey: CACHE_KEYS?.FIELDS,
    fallbackOptions: FALLBACK_OPTIONS,
  });
}
