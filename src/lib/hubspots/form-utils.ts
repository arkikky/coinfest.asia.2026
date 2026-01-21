import type {
  HubSpotFormData,
  FormOption,
  HubSpotField,
} from "@/types/hubspots/form.types";

// @helper(extract field options)
export function extractFieldOptions(
  data: HubSpotFormData,
  fieldName: string
): FormOption[] {
  const fields =
    data?.fields ||
    data?.fieldGroups?.flatMap((group) => group.fields || []) ||
    [];

  const targetField = fields.find((field) => field?.name === fieldName);

  if (!targetField?.options || !Array.isArray(targetField.options)) {
    return [];
  }

  return targetField.options
    .map((option) => ({
      value: option?.value ?? "",
      label: option?.label ?? option?.value ?? "",
    }))
    .filter((option) => option.value && option.label);
}

// @helper(validate options)
export function validateOptions(options: FormOption[]): boolean {
  return (
    Array.isArray(options) &&
    options.length > 0 &&
    options.every((opt) => opt.value && opt.label)
  );
}
