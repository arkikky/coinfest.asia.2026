"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ControlTabsFormsProps = {
  count: number;
  activeTab: number;
  onTabChange: (index: number) => void;
};

export default function ControlTabsForms({
  count,
  activeTab,
  onTabChange,
}: ControlTabsFormsProps) {
  if (count <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-1.5 px-0 pt-6.5 w-max ml-auto">
      <button
        id={`${process.env.REG}`}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onTabChange(Math.max(0, activeTab - 1));
        }}
        disabled={activeTab === 0}
        className="relative cursor-pointer inline-flex flex-row items-center justify-center gap-x-1 shrink-0 px-4 py-2.5 sm:py-1.75 rounded-lg text-sm sm:text-base font-medium leading-[initial] transition-all duration-200 focus:outline-none border-2 bg-primary border-white text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="size-4" />
        Prev
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          onTabChange(Math.min(count - 1, activeTab + 1));
        }}
        disabled={activeTab >= count - 1}
        className="relative cursor-pointer inline-flex flex-row items-center justify-center gap-x-1 shrink-0 px-4 py-2.5 sm:py-1.75 rounded-lg text-sm sm:text-base font-medium leading-[initial] transition-all duration-200 focus:outline-none border-2 bg-primary border-white text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
