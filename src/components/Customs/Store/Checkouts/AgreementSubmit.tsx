"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type AgreementSubmitProps = {
  agreedToTerms: boolean;
  isSubmitting: boolean;
  fieldsLength: number;
  errorMessage?: string;
  onAgreementChange: (checked: boolean) => void;
};

export default function AgreementSubmit({
  agreedToTerms,
  isSubmitting,
  fieldsLength,
  errorMessage,
  onAgreementChange,
}: AgreementSubmitProps) {
  return (
    <div className="flex flex-col justify-start space-y-4 border border-gray-200 py-4 px-4 rounded-xl">
      <div className="flex items-start gap-3">
        <Checkbox
          id="agreement"
          checked={agreedToTerms}
          onCheckedChange={(checked) => {
            onAgreementChange(checked === true);
          }}
          className={`mt-0.5 ${errorMessage ? "border-red-500 text-red-600" : ""}`}
        />
        <label
          htmlFor="agreement"
          className={`flex-1 text-sm itms-pointer ${errorMessage ? "text-red-600 [&_a]:text-red-600" : "text-muted-foreground"}`}
        >
          <p className="leading-relaxed">
            I have read and agree to{" "}
            <Link href="/privacy-policy" className="text-primary underline">
              {`privacy policy`}
            </Link>{" "}
            &{" "}
            <Link href="/terms-conditions" className="text-primary underline">
              {`terms and conditions`}
            </Link>
          </p>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            {`Your data will be used to process your order and to improve your experience. By choosing this payment method, you consent to having your order data processed by the payment processor.`}
          </p>
        </label>
      </div>
      {errorMessage ? (
        <p className="text-xs text-red-600 ml-7">{errorMessage}</p>
      ) : null}

      {/* @submit(orders) */}
      <Button
        type="submit"
        variant={"primary"}
        className="px-6 py-7 text-base capitalize"
        // disabled={isSubmitting || fieldsLength === 0 || !agreedToTerms}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Proceed..." : "Proceed to payment"}
      </Button>
    </div>
  );
}
