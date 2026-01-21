"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col justify-start space-y-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id="agreement"
          checked={agreedToTerms}
          onCheckedChange={(checked) => {
            onAgreementChange(checked === true);
          }}
          className="mt-0.5"
        />
        <label
          htmlFor="agreement"
          className="flex-1 text-sm text-gray-700 itms-pointer"
        >
          <p className="leading-relaxed">
            I have read and agree to{" "}
            <a href="#" className="text-gray-900 underline hover:text-gray-700">
              privacy policy
            </a>{" "}
            &{" "}
            <a href="#" className="text-gray-900 underline hover:text-gray-700">
              terms and conditions
            </a>
          </p>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            Your data will be used to process your order and to improve your
            experience. By choosing this payment method, you consent to having
            your order data processed by the payment processor.
          </p>
        </label>
      </div>
      {errorMessage ? (
        <p className="text-xs text-red-600 ml-7">{errorMessage}</p>
      ) : null}
      <Button
        type="submit"
        variant={"primary"}
        className="px-6 py-7 text-base"
        disabled={isSubmitting || fieldsLength === 0 || !agreedToTerms}
      >
        {isSubmitting ? "Proceed..." : "Proceed to payment"}
      </Button>
    </div>
  );
}
