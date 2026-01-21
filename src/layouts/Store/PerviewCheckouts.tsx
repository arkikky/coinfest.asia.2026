"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Form } from "@/components/ui/form";
import { useOrderStore } from "@/stores/OrderStore";
import AttendeeTabs from "@/components/Customs/Store/Checkouts/AttendeeTabs";
import AttendeeCards from "@/components/Customs/Store/Checkouts/AttendeeCards";
import AgreementSubmit from "@/components/Customs/Store/Checkouts/AgreementSubmit";
import {
  getOrderId,
  clearOrderItemIds,
  clearOrderId,
  clearGuestSessionId,
} from "@/lib/cookies";

// @schema(attendee form)
import {
  AttendeeFormSchema,
  AgreementSchema,
  type AttendeeFormValues,
} from "@/schema/store/attendee.schema";

// @imports(constants)
import {
  emptyAttendee,
  COPYABLE_ATTENDEE_FIELDS,
} from "@/constants/store/attendee.constants";
import {
  AttendeeSlot,
  AttendeeGroup,
  PerviewCheckoutProps,
} from "@/types/store/checkouts/attendee.types";

// @import(payment service)
import { PaymentService } from "@/services/payments/payment.service";

export default function PerviewCheckouts({
  idx = "Generals",
}: PerviewCheckoutProps) {
  const router = useRouter();
  const orderItems = useOrderStore((state) => state?.orderItems);
  const currentOrderId = useOrderStore((state) => state?.currentOrderId);

  // @attendee(groups)
  const attendeeGroups = useMemo<AttendeeGroup[]>(() => {
    if (!orderItems || orderItems.length === 0) return [];
    let itms = 0;

    return orderItems
      .map((item) => {
        const qty = Math.max(0, item?.quantity || 0);
        if (qty === 0) return null;

        const metadata = item?.metadata as
          | { name?: string; variant_product?: string }
          | undefined;
        const ticketName = metadata?.name || `Ticket ${item?.id_products}`;
        const group: AttendeeGroup = {
          orderItemId: item?.id_order_items,
          label: ticketName,
          count: qty,
          startIndex: itms,
          variant_product: metadata?.variant_product,
        };
        itms += qty;
        return group;
      })
      .filter((g): g is AttendeeGroup => Boolean(g));
  }, [orderItems]);

  //   @attendee(slots)
  const attendeeSlots = useMemo<AttendeeSlot[]>(() => {
    const slots: AttendeeSlot[] = [];
    attendeeGroups.forEach((group) => {
      for (let i = 0; i < group?.count; i += 1) {
        slots.push({
          orderItemId: group?.orderItemId,
          label: `Attendee ${i + 1}`,
        });
      }
    });
    return slots;
  }, [attendeeGroups]);
  const totalSlots = attendeeSlots?.length;

  // @forms
  const form = useForm<AttendeeFormValues>({
    resolver: zodResolver(AttendeeFormSchema) as Resolver<AttendeeFormValues>,
    defaultValues: {
      attendees: [],
    },
    mode: "all",
  });
  const {
    control,
    handleSubmit,
    getValues,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
    setValue,
    reset,
  } = form;
  const { fields, replace } = useFieldArray({
    control,
    name: "attendees",
  });
  // @agreed
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // @tabs(state) - Track active tab per group
  const [activeTabPerGroup, setActiveTabPerGroup] = useState<
    Record<string, number>
  >({});

  // @handle(copyƒ)
  const handleCopyAttendee = (index: number) => {
    if (index === 0) return;
    const source = getValues("attendees.0");
    if (!source) return;

    COPYABLE_ATTENDEE_FIELDS.forEach((key) => {
      setValue(`attendees.${index}.${key}`, source?.[key] ?? "", {
        shouldValidate: true,
      });
    });
    setValue(
      `attendees.${index}.is_working_with_company`,
      source?.is_working_with_company ?? false,
      { shouldValidate: true }
    );
    setValue(
      `attendees.${index}.custom_questions`,
      source?.custom_questions?.length
        ? source?.custom_questions
        : emptyAttendee?.custom_questions,
      { shouldValidate: true }
    );
    setValue(
      `attendees.${index}.social_accounts`,
      source?.social_accounts?.length
        ? source?.social_accounts
        : emptyAttendee?.social_accounts,
      { shouldValidate: true }
    );
  };

  useEffect(() => {
    if (totalSlots === 0) {
      replace([]);
      return;
    }

    const current = getValues("attendees") || [];
    const next = Array?.from({ length: totalSlots }, (_, idx) => {
      return current[idx] || { ...emptyAttendee };
    });
    replace(next);
  }, [totalSlots, getValues, replace]);

  // @submit(forms)
  const onSubmit = async (values: AttendeeFormValues) => {
    // @validate(agreement)
    const agreementCheck = AgreementSchema?.safeParse({
      agreement: agreedToTerms,
    });
    if (!agreementCheck?.success) {
      const message =
        agreementCheck?.error.issues?.[0]?.message ||
        "You must agree before continuing";
      setError("root", { message });
      return;
    }
    clearErrors("root");

    const payload =
      values?.attendees
        ?.map((attendee, idx) => {
          const { is_working_with_company, ...rest } = attendee;
          const custom_questions =
            attendee.custom_questions?.length && attendee.custom_questions?.[0]
              ? attendee.custom_questions
              : emptyAttendee?.custom_questions;
          const social_accounts =
            attendee.social_accounts?.length && attendee.social_accounts?.[0]
              ? attendee.social_accounts
              : emptyAttendee?.social_accounts;
          return {
            ...rest,
            custom_questions,
            social_accounts,
            id_order_items: attendeeSlots[idx]?.orderItemId,
          };
        })
        .filter(Boolean) || [];
    if (!payload.length) {
      console.error("No attendee data to submit");
      return;
    }

    try {
      // @submit(attendees)
      const response = await fetch("/api/v1/attendees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ attendees: payload }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError("root", {
          message: errorData?.error || "Failed to submit attendee form",
        });
        return;
      }
      const result = await response.json();
      const customerId = result?.data?.customer_id;
      if (!customerId) {
        setError("root", {
          message: "Failed to get customer ID from response",
        });
        return;
      }

      // @fetch(order data for payment)
      const orderId = currentOrderId || getOrderId();
      if (!orderId) {
        setError("root", {
          message: "Order ID not found. Please refresh the page.",
        });
        return;
      }
      const order_checkouts = await fetch(
        `/api/v1/orders?id_orders=${encodeURIComponent(orderId)}`
      );
      if (!order_checkouts.ok) {
        setError("root", {
          message: "Failed to fetch order data",
        });
        return;
      }
      const result_payments = await order_checkouts.json();
      const order = result_payments?.data;
      if (!order) {
        setError("root", {
          message: "Order data not found",
        });
        return;
      }

      // @get(first attendee data)
      const firstAttendee = values?.attendees?.[0];
      if (!firstAttendee) {
        setError("root", {
          message: "First attendee data not found",
        });
        return;
      }
      const fullname = `${firstAttendee?.first_name || ""} ${
        firstAttendee?.last_name || ""
      }`.trim();
      const payerEmail = firstAttendee?.email || "";
      const amount = order?.grand_order_total || 0;

      if (!payerEmail || !fullname) {
        setError("root", {
          message: "Invalid payment data. Please check your information.",
        });
        return;
      }

      // @process(payment via service)
      try {
        const invoiceUrl = await PaymentService.processPayment({
          customerId,
          amount,
          payerEmail,
          fullname,
          orderId,
        });
        reset();

        // @clear(cookies)
        clearOrderItemIds();
        clearOrderId();
        clearGuestSessionId();

        // @redirect(based on payment type)
        if (invoiceUrl) {
          // Paid order - redirect to invoice
          router.replace(invoiceUrl);
        } else {
          // Free order - redirect to order received
          router.replace(`/checkout/order-received?process=${orderId}`);
        }
      } catch (paymentError) {
        console.error("Payment processing error:", paymentError);
        setError("root", {
          message:
            paymentError instanceof Error
              ? paymentError.message
              : "Payment processing failed. Please try again.",
        });
        return;
      }
    } catch (error) {
      console.error("Error submitting attendee form:", error);
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again.",
      });
    }
  };

  // @helper(check errors for tab)
  const hasAttendeeErrors = (globalIndex: number): boolean => {
    if (!errors?.attendees) return false;
    return !!errors.attendees[globalIndex];
  };

  return (
    <>
      <div>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
            Step 3 of 4
          </p>
          <div className="mb-2">
            {/* <Breadcrumbs
              showStepIndicator={true}
              items={[
                { label: "Tickets", href: "/" },
                { label: "Basket", href: basketHref },
                { label: "Information" },
                { label: "Payment" },
              ]}
            /> */}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Billing details
          </h1>
          <p className="text-sm text-gray-600">
            {`Enter your billing information for CoinfestAsia We&apos;ll use this
            for your tickets and invoice.`}
          </p>
        </div>

        {/* @forms(checkouts) */}
        <Form {...form}>
          <form
            id={`${process.env.NEXT_PUBLIC_REGX}CheckoutForm_Attendee`}
            className="supports-grid:grid grid-cols-1 xl:grid-cols-5 gap-4.5 pt-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            {fields?.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                No attendee slots available. Please add tickets to continue.
              </div>
            ) : (
              attendeeGroups?.map((group) => {
                const groupFields = Array?.from(
                  { length: group?.count },
                  (_, idx) => {
                    const globalIndex = group?.startIndex + idx;
                    return { field: fields[globalIndex], index: globalIndex };
                  }
                ).filter(({ field }) => Boolean(field));

                // @state(active tab for this group)
                const activeTab = activeTabPerGroup[group?.orderItemId] || 0;
                const setActiveTab = (tabIndex: number) => {
                  setActiveTabPerGroup((prev) => ({
                    ...prev,
                    [group?.orderItemId]: tabIndex,
                  }));
                };

                return (
                  <div
                    key={group?.orderItemId}
                    // className={`col-span-full mb-6 rounded-2xl bg-primary pt-1 pb-2.5 px-2.5 mr-0 xl:mr-14`}
                    className={`col-span-full mb-6 rounded-2xl bg-primary pt-1 pb-2.5 px-2.5 mr-0`}
                    style={
                      group?.variant_product
                        ? { backgroundColor: group?.variant_product }
                        : { backgroundColor: "bg-primary" }
                    }
                  >
                    {/* @group(label) */}
                    <div
                      className={`flex flex-col gap-y-0.5 pt-3.5 ${
                        group?.count > 1 ? "pb-0" : "pb-5"
                      } sticky top-0 z-10`}
                      style={
                        group?.variant_product
                          ? { backgroundColor: group?.variant_product }
                          : { backgroundColor: "bg-primary" }
                      }
                    >
                      <p className="text-lg font-semibold leading-[initial] text-center text-white">
                        {group?.label}
                      </p>
                      {/* <p className="text-xs text-gray-500">
                        {group?.count} attendee{group?.count > 1 ? "s" : ""}{" "}
                        required
                      </p> */}

                      {/* @tabs(attendee) */}
                      <AttendeeTabs
                        count={group?.count}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        hasErrors={(tabIndex) => {
                          const globalIndex = group?.startIndex + tabIndex;
                          return hasAttendeeErrors(globalIndex);
                        }}
                      />
                    </div>

                    {/* @attendees */}
                    {groupFields?.map(({ field, index }, localIndex) => {
                      const slot = attendeeSlots[index];
                      if (!field || !slot) return null;

                      // @only(active tab's)
                      if (localIndex !== activeTab) return null;

                      return (
                        <AttendeeCards
                          key={field?.id}
                          control={control}
                          index={index}
                          slot={slot}
                          isSubmitting={isSubmitting}
                          watch={watch}
                          setValue={setValue}
                          onCopyAttendee={handleCopyAttendee}
                        />
                      );
                    })}
                  </div>
                );
              })
            )}

            {/* @submit(forms) */}
            <div className="col-span-full">
              {fields?.length > 0 ? (
                <>
                  <AgreementSubmit
                    agreedToTerms={agreedToTerms}
                    isSubmitting={isSubmitting}
                    fieldsLength={fields?.length}
                    errorMessage={errors?.root?.message}
                    onAgreementChange={(checked: boolean) => {
                      setAgreedToTerms(checked);
                      clearErrors("root");
                    }}
                  />
                </>
              ) : null}
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
