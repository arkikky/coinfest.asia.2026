// "use client";
// import { useQuery, UseQueryResult } from "@tanstack/react-query";
// import type { FormOption } from "@/types/hubspots/form.types";
// import {
//   getCachedOptions,
//   setCachedOptions,
//   validateOptions,
// } from "@/lib/hubspots/form-utils";

// export const CACHE_DURATION = {
//   ONE_HOUR: 1000 * 60 * 60,
//   ONE_DAY: 1000 * 60 * 60 * 24,
// } as const;

// // @types(hook options)
// type UseFormFieldOptionsConfig = {
//   fieldName: string;
//   apiEndpoint: string;
//   cacheKey: string;
//   fallbackOptions: FormOption[];
//   cacheDuration?: number;
//   staleTime?: number;
//   gcTime?: number;
// };

// // @factory(fetch function)
// function createFetchFunction(config: UseFormFieldOptionsConfig) {
//   return async (): Promise<FormOption[]> => {
//     // @localStorage(cache)
//     const cached = getCachedOptions(
//       config?.cacheKey,
//       config?.cacheDuration || CACHE_DURATION?.ONE_HOUR
//     );
//     if (cached) {
//       console.log(`Using cached ${config?.fieldName} options`);
//       return cached;
//     }

//     // @fetch(API)
//     try {
//       const response = await fetch(config.apiEndpoint);
//       if (!response.ok) {
//         throw new Error(`API error: ${response.status}`);
//       }

//       const data = await response.json();
//       const options = Array.isArray(data?.options) ? data.options : [];

//       // @validate-and-cache
//       if (!validateOptions(options)) {
//         console.warn(
//           `Invalid options from API for ${config.fieldName}, using fallback`
//         );
//         return config.fallbackOptions;
//       }

//       setCachedOptions(config.cacheKey, options);
//       return options;
//     } catch (error) {
//       console.error(`Failed to fetch ${config.fieldName} options:`, error);
//       return config.fallbackOptions;
//     }
//   };
// }

// // @hook(generic form field options)
// export function useFormFieldOptions(
//   config: UseFormFieldOptionsConfig
// ): UseQueryResult<FormOption[], Error> {
//   return useQuery({
//     queryKey: [config.cacheKey],
//     queryFn: createFetchFunction(config),
//     staleTime: config?.staleTime || CACHE_DURATION?.ONE_HOUR,
//     gcTime: config?.gcTime || CACHE_DURATION?.ONE_DAY,
//     retry: 3,
//     retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
//     refetchOnWindowFocus: false,
//     refetchOnMount: false,
//     placeholderData: config.fallbackOptions,
//   });
// }

"use client";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { FormOption } from "@/types/hubspots/form.types";
import { validateOptions } from "@/lib/hubspots/form-utils";

export const CACHE_DURATION = {
  ONE_HOUR: 1000 * 60 * 60,
  ONE_DAY: 1000 * 60 * 60 * 24,
} as const;

// @types(hook options)
type UseFormFieldOptionsConfig = {
  fieldName: string;
  apiEndpoint: string;
  cacheKey: string;
  fallbackOptions: FormOption[];
  cacheDuration?: number;
  staleTime?: number;
  gcTime?: number;
};

// @factory(fetch function)
function createFetchFunction(config: UseFormFieldOptionsConfig) {
  return async (): Promise<FormOption[]> => {
    // @fetch(API)
    try {
      const response = await fetch(config.apiEndpoint);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const options = Array.isArray(data?.options) ? data.options : [];

      // @validate
      if (!validateOptions(options)) {
        console.warn(
          `Invalid options from API for ${config.fieldName}, using fallback`
        );
        return config.fallbackOptions;
      }

      return options;
    } catch (error) {
      console.error(`Failed to fetch ${config.fieldName} options:`, error);
      return config.fallbackOptions;
    }
  };
}

// @hook(generic form field options)
export function useFormFieldOptions(
  config: UseFormFieldOptionsConfig
): UseQueryResult<FormOption[], Error> {
  return useQuery({
    queryKey: [config.cacheKey],
    queryFn: createFetchFunction(config),
    staleTime: config?.staleTime || CACHE_DURATION?.ONE_HOUR,
    gcTime: config?.gcTime || CACHE_DURATION?.ONE_DAY,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: config.fallbackOptions,
  });
}
