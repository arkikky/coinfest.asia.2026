import {
  HUBSPOT_FORM_ID,
  HUBSPOT_API_URL,
} from "@/constants/hubspots/form.constants";
import type { HubSpotFormData, FormOption } from "@/types/hubspots/form.types";
import { extractFieldOptions } from "@/lib/hubspots/form-utils";

// @service(fetch hubspot form)
export async function fetchHubSpotForm(
  formId: string = HUBSPOT_FORM_ID
): Promise<HubSpotFormData> {
  const response = await fetch(`${HUBSPOT_API_URL}/${formId}`, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_HBICNHUB}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HubSpot API error: ${response.status}`);
  }

  return response.json();
}

// @service(get field options)
export async function getHubSpotFieldOptions(
  fieldName: string,
  fallbackOptions: FormOption[],
  formId?: string
): Promise<FormOption[]> {
  try {
    const data = await fetchHubSpotForm(formId);
    const options = extractFieldOptions(data, fieldName);

    if (options.length === 0) {
      console.warn(
        `No options found for field "${fieldName}", using fallback options`
      );
      return fallbackOptions;
    }

    return options;
  } catch (error) {
    console.error(`Failed to load options for field "${fieldName}":`, error);
    return fallbackOptions;
  }
}
