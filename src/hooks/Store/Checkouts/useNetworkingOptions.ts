"use client";
import { useFormFieldOptions } from "@/hooks/hubspots/useFormFieldOptions";
import {
  CACHE_KEYS,
  FALLBACK_OPTIONS,
} from "@/constants/hubspots/networking.constants";

// @hook(company size options)
export function useNetworkingOptions() {
  return useFormFieldOptions({
    fieldName:
      "what_type_of_connections_and_networking_do_you_hope_to_achieve_at_coinfest_asia_",
    apiEndpoint: "/api/v1/store/networking",
    cacheKey: CACHE_KEYS?.FIELDS,
    fallbackOptions: FALLBACK_OPTIONS,
  });
}
