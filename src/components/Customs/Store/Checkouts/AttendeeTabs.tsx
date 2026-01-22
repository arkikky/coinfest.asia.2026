"use client";
import { cn } from "@/lib/utils";
import { CircleAlertIcon } from "lucide-react";

// @types(props)
type AttendeeTabsProps = {
  count: number;
  activeTab: number;
  onTabChange: (index: number) => void;
  hasErrors?: (index: number) => boolean;
};

export default function AttendeeTabs({
  count,
  activeTab,
  onTabChange,
  hasErrors,
}: AttendeeTabsProps) {
  if (count <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 scrollbar-hide overflow-x-auto pt-2.5 pb-2.5">
      {Array?.from({ length: count }, (_, idx) => {
        const isActive = activeTab === idx;
        const hasError = hasErrors?.(idx) || false;

        return (
          <button
            key={idx}
            type="button"
            onClick={(event) => {
              onTabChange(idx);
              event.currentTarget.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center",
              });
            }}
            className={cn(
              "relative shrink-0 px-2.5 sm:px-3 py-1.5 sm:py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
              "focus:outline-none border-2 bg-white/20 border-white text-white",
              isActive ? " opacity-100" : "opacity-40",
              hasError && isActive && "bg-red-500/20 border-red-600",
              hasError && !isActive && "bg-red-500/20 border-red-600"
            )}
          >
            <span className="flex items-center gap-2">
              <span className="leading-[initial]">Attendee {idx + 1}</span>
              {hasError && (
                <CircleAlertIcon className={cn("size-3.5 sm:size-4 text-red-500")} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
