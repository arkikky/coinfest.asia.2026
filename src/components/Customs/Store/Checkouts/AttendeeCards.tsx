"use client";
import { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { AttendeeFormValues } from "@/schema/store/attendee.schema";
import { AttendeeSlot } from "@/types/store/checkouts/attendee.types";
import AttendeeFormFields from "./AttendeeFormFields";

// @types(props)
type AttendeeCardProps = {
  control: Control<AttendeeFormValues>;
  index: number;
  slot: AttendeeSlot;
  isSubmitting: boolean;
  watch: UseFormWatch<AttendeeFormValues>;
  setValue: UseFormSetValue<AttendeeFormValues>;
  onCopyAttendee: (index: number) => void;
};

export default function AttendeeCards({
  control,
  index,
  slot,
  isSubmitting,
  watch,
  setValue,
  onCopyAttendee,
}: AttendeeCardProps) {
  const isWorking = watch(`attendees.${index}.is_working_with_company`);

  return (
    <div className="flex flex-col rounded-lg border bg-white p-4">
      {/* @header */}
      <div className="flex items-center justify-between">
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
            variant="primary"
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

      {/* @divider */}
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
    </div>
  );
}
