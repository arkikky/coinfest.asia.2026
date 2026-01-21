// @types(hubspot options)
export type HubSpotOption = {
  value?: string;
  label?: string;
};

// @types(hubspot field)
export type HubSpotField = {
  name?: string;
  fieldType?: string;
  objectTypeId?: string;
  options?: HubSpotOption[];
};

// @types(hubspot form group)
export type HubSpotFormGroup = {
  fields?: HubSpotField[];
};

// @types(hubspot form data)
export type HubSpotFormData = {
  fieldGroups?: HubSpotFormGroup[];
  fields?: HubSpotField[];
};

// @types(generic option)
export type FormOption = {
  value: string;
  label: string;
};

// @types(api response)
export type FormOptionsResponse = {
  options: FormOption[];
  cached?: boolean;
  source?: "data" | "fallback" | "cache";
};
