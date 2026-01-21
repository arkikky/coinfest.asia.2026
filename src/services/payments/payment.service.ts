interface PaymentData {
    customerId: string;
    amount: number;
    payerEmail: string;
    fullname: string;
    orderId: string;
  }
  
  interface EmailData {
    orderId: string;
    payerEmail: string;
    fullname: string;
    amount: number;
    isFree: boolean;
  }
  
  export class PaymentService {
    // @process(free order)
    static async processFreeOrder(orderId: string): Promise<void> {
      try {
        const response = await fetch(`/api/v1/orders?id_orders=${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_status: "paid",
            paid_at: new Date().toISOString(),
          }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to update free order status");
        }
      } catch (error) {
        console.error("Error processing free order:", error);
        throw error;
      }
    }
  
    // @process(paid order)
    static async processPaidOrder(data: PaymentData): Promise<{
      invoiceUrl: string;
      paymentIntentId: string;
    }> {
      try {
        const response = await fetch("/api/payments/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_SECRET_TOKEN_ENCRYPT || "",
          },
          body: JSON.stringify({
            extrnlId: data.customerId?.replace(/^CS-/, ""),
            amount: data.amount,
            payerEmail: data.payerEmail,
            fullname: data.fullname,
            order: data.orderId,
          }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to create payment");
        }
  
        const result = await response.json();
  
        if (!result?.data?.invoice_url) {
          throw new Error(
            result?.error?.message ||
              "Failed to get invoice URL from payment provider"
          );
        }
  
        return {
          invoiceUrl: result.data.invoice_url,
          paymentIntentId: result.data.id,
        };
      } catch (error) {
        console.error("Error processing paid order:", error);
        throw error;
      }
    }
  
    // @update(order with payment intent)
    static async updateOrderPaymentIntent(
      orderId: string,
      paymentIntentId: string
    ): Promise<void> {
      try {
        await fetch(`/api/v1/orders?id_orders=${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntentId,
          }),
        });
      } catch (error) {
        console.error("Failed to update order with payment_intent_id:", error);
        // Continue even if update fails
      }
    }
  
    // @send(email notification)
    static async sendOrderEmail(data: EmailData): Promise<void> {
      try {
        const response = await fetch("/api/emails/order-confirmation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId: data.orderId,
            email: data.payerEmail,
            fullname: data.fullname,
            amount: data.amount,
            isFree: data.isFree,
            sentAt: new Date().toISOString(),
          }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to send order confirmation email");
        }
      } catch (error) {
        console.error("Error sending order email:", error);
        // Don't throw - email failure shouldn't stop the order process
      }
    }
  
    // @main(process payment)
    static async processPayment(data: PaymentData): Promise<string | null> {
      const { amount, orderId, payerEmail, fullname } = data;
  
      // @handle(free order)
      if (amount <= 0) {
        await this.processFreeOrder(orderId);
        // Email will be sent from order-received page
        return null; // No invoice URL for free orders
      }
  
      // @handle(paid order)
      const { invoiceUrl, paymentIntentId } = await this.processPaidOrder(data);
  
      // @update(payment intent)
      await this.updateOrderPaymentIntent(orderId, paymentIntentId);
      // Email will be sent from order-received page (after payment completes)
  
      return invoiceUrl;
    }
  }