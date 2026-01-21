"use client";

// @interface
type PerviewProps = {
  idx?: string;
};

export default function PerviewLayouts({ idx = "Generals" }: PerviewProps) {
  return <div className="flex flex-col lg:flex-row lg:min-h-screen"></div>;
}
