"use client";

// @interface
type GuestCheckoutProps = {
  idx?: string;
};

export default function GuestCheckouts({ idx = "GuestCheckout-Generals" }: GuestCheckoutProps) {
  return <div className="flex flex-col lg:flex-row lg:min-h-screen"></div>;
}
