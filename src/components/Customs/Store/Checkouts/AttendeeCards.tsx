"use client";
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { AttendeeFormValues } from "@/schema/store/attendee.schema";
import { AttendeeSlot } from "@/types/store/checkouts/attendee.types";
import AttendeeFormFields from "./AttendeeFormFields";
import ControlTabsForms from "./ControlTabsForms";

// @types(props)
type AttendeeCardProps = {
  control: Control<AttendeeFormValues>;
  index: number;
  slot: AttendeeSlot;
  isSubmitting: boolean;
  watch: UseFormWatch<AttendeeFormValues>;
  setValue: UseFormSetValue<AttendeeFormValues>;
  onCopyAttendee: (index: number) => void;
  controlTabsCount?: number;
  controlTabsActiveTab?: number;
  onControlTabsChange?: (index: number) => void;
};

export default function AttendeeCards({
  control,
  index,
  slot,
  isSubmitting,
  watch,
  setValue,
  onCopyAttendee,
  controlTabsCount,
  controlTabsActiveTab,
  onControlTabsChange,
}: AttendeeCardProps) {
  const isWorking = watch(`attendees.${index}.is_working_with_company`);
  const shouldShowControls =
    typeof controlTabsCount === "number" &&
    typeof controlTabsActiveTab === "number" &&
    typeof onControlTabsChange === "function";

  return (
    <div className="flex flex-col rounded-lg border bg-white p-4">
      {/* @header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-start sm:justify-between gap-y-2.5">
        <div className="flex flex-col items-start justify-start">
          <span className="text-base font-semibold capitalize text-black leaeding-[initial]">
            {slot?.label}
          </span>
          <span className="text-sm text-muted-foreground">
            {`Person attending the event.`}
          </span>
        </div>
        {index > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.preventDefault();
              onCopyAttendee(index);
            }}
          >
            <Copy className="size-4 shrink-0" />
            {`Copy previous details`}
          </Button>
        ) : null}
      </div>
      <div className="border-t border-dashed border-muted-foreground/40 my-5 w-full"></div>

      {/* @fields */}
      <AttendeeFormFields
        control={control}
        index={index}
        isSubmitting={isSubmitting}
        isWorking={!!isWorking}
        watch={watch}
        setValue={setValue}
      />

      {/* @controll-tabs */}
      {shouldShowControls ? (
        <ControlTabsForms
          count={controlTabsCount}
          activeTab={controlTabsActiveTab}
          onTabChange={onControlTabsChange}
        />
      ) : null}
    </div>
  );
}
