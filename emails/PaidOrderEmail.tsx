import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Link,
    Button,
    Hr,
    Heading,
  } from "@react-email/components";
  
  interface PaidOrderEmailProps {
    orderId: string;
    fullname: string;
    amount: number;
    sentAt: string;
    orderUrl: string;
  }
  
  export default function PaidOrderEmail({
    orderId = "ORDER-123",
    fullname = "John Doe",
    amount = 100,
    sentAt = new Date().toISOString(),
    orderUrl = "https://example.com/order",
  }: PaidOrderEmailProps) {
    const formattedDate = new Date(sentAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  
    const formattedAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  
    return (
      <Html>
        <Head />
        <Body style={main}>
          <Container style={container}>
            <Heading style={h1}>Order Confirmation - Payment Required 💳</Heading>
            
            <Text style={text}>Hi {fullname},</Text>
            
            <Text style={text}>
              Thank you for your order! Your ticket reservation has been created and is waiting for payment confirmation.
            </Text>
  
            <Section style={infoSection}>
              <Text style={infoLabel}>Order ID:</Text>
              <Text style={infoValue}>{orderId}</Text>
              
              <Text style={infoLabel}>Order Date:</Text>
              <Text style={infoValue}>{formattedDate}</Text>
              
              <Text style={infoLabel}>Total Amount:</Text>
              <Text style={infoValueAmount}>{formattedAmount}</Text>
            </Section>
  
            <Section style={warningSection}>
              <Text style={warningText}>
                ⚠️ Please complete your payment to secure your tickets.
              </Text>
            </Section>
  
            <Section style={buttonSection}>
              <Button style={button} href={orderUrl}>
                Complete Payment
              </Button>
            </Section>
  
            <Hr style={hr} />
  
            <Text style={footer}>
              Your tickets will be sent to you once payment is confirmed. Please complete the payment within 24 hours to avoid order cancellation.
            </Text>
  
            <Text style={footer}>
              If you have any questions about your order or payment, please contact our support team.
            </Text>
  
            <Text style={footerSmall}>
              © {new Date().getFullYear()} CoinfestAsia. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Html>
    );
  }
  
  // @styles
  const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
      '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  };
  
  const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    maxWidth: "600px",
  };
  
  const h1 = {
    color: "#333",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "40px 0",
    padding: "0 40px",
    textAlign: "center" as const,
  };
  
  const text = {
    color: "#333",
    fontSize: "16px",
    lineHeight: "26px",
    padding: "0 40px",
    margin: "16px 0",
  };
  
  const infoSection = {
    padding: "24px 40px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    margin: "24px 40px",
  };
  
  const infoLabel = {
    color: "#6c757d",
    fontSize: "14px",
    fontWeight: "600",
    margin: "8px 0 4px 0",
  };
  
  const infoValue = {
    color: "#333",
    fontSize: "16px",
    margin: "0 0 16px 0",
  };
  
  const infoValueAmount = {
    color: "#007bff",
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0 0 16px 0",
  };
  
  const warningSection = {
    padding: "16px 40px",
    backgroundColor: "#fff3cd",
    borderRadius: "8px",
    margin: "24px 40px",
    borderLeft: "4px solid #ffc107",
  };
  
  const warningText = {
    color: "#856404",
    fontSize: "14px",
    fontWeight: "600",
    margin: "0",
  };
  
  const buttonSection = {
    padding: "24px 40px",
    textAlign: "center" as const,
  };
  
  const button = {
    backgroundColor: "#28a745",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 32px",
  };
  
  const hr = {
    borderColor: "#e6ebf1",
    margin: "32px 40px",
  };
  
  const footer = {
    color: "#6c757d",
    fontSize: "14px",
    lineHeight: "24px",
    padding: "0 40px",
    margin: "8px 0",
  };
  
  const footerSmall = {
    color: "#8898aa",
    fontSize: "12px",
    lineHeight: "16px",
    padding: "0 40px",
    margin: "24px 0 0 0",
    textAlign: "center" as const,
  };