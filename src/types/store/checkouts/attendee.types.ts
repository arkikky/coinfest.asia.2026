// @types(attendee slot)
export type AttendeeSlot = {
  orderItemId: string;
  label: string;
};

// @types(attendee group)
export type AttendeeGroup = {
  orderItemId: string;
  label: string;
  count: number;
  startIndex: number;
  variant_product?: string;
};

// @types(component props)
export type PerviewCheckoutProps = {
  idx?: string;
};
