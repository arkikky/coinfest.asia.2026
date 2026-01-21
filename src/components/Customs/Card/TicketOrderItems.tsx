import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface TicketOrderItemsProps {
  ticket: {
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number | null;
    quantityAvailable: number;
    isGroup: boolean;
    total_group?: number;
  };
  quantity: number;
  onQuantityChange: (delta: number) => void;
  formatPrice: (price: number) => string;
}

export function TicketOrderItems({
  ticket,
  quantity,
  onQuantityChange,
  formatPrice,
}: TicketOrderItemsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLongDescription = ticket?.description.length > 140;
  const displayedDescription =
    isExpanded || !isLongDescription
      ? ticket?.description
      : `${ticket?.description.slice(0, 140)}...`;

  return (
    <div
      className="grid grid-cols-12 gap-4 py-6 border-b border-gray-200"
      style={{ willChange: "transform, background-color" }}
    >
      <div className="col-span-5">
        <div className="font-semibold text-gray-900 mb-1">
          {ticket?.name}
          {ticket?.isGroup && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              GROUP
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 mb-2">{displayedDescription}</div>
        {isLongDescription && (
          <Button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            variant="ghost"
            className="font-normal! cursor-pointer p-0 h-auto text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        )}
      </div>
      <div className="col-span-3 text-right">
        {ticket?.originalPrice && ticket?.originalPrice > ticket?.price ? (
          <div>
            <div className="text-gray-400 line-through text-sm">
              {formatPrice(ticket?.originalPrice)}
            </div>
            <div className="font-semibold text-gray-900">
              {formatPrice(ticket?.price)}
            </div>
          </div>
        ) : (
          <div className="font-semibold text-gray-900">
            {formatPrice(ticket?.price)}
          </div>
        )}
      </div>
      <div className="col-span-4">
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={(e) => {
              e.preventDefault();
              onQuantityChange(-1);
            }}
            disabled={quantity === 0}
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Decrease quantity"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <span className="w-12 text-center font-medium text-gray-900">
            {quantity}
          </span>
          <Button
            onClick={(e) => {
              e.preventDefault();
              onQuantityChange(1);
            }}
            disabled={quantity >= ticket?.quantityAvailable}
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500 text-right mt-1">
          {ticket?.quantityAvailable} available
        </div>
      </div>
    </div>
  );
}
