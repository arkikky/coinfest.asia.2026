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

interface FreeOrderEmailProps {
  orderId: string;
  fullname: string;
  amount: number;
  sentAt: string;
  orderUrl: string;
}

export default function FreeOrderEmail({
  orderId = "ORDER-123",
  fullname = "John Doe",
  amount = 0,
  sentAt = new Date().toISOString(),
  orderUrl = "https://example.com/order",
}: FreeOrderEmailProps) {
  const formattedDate = new Date(sentAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Free Ticket Confirmed! 🎉</Heading>

          <Text style={text}>Hi {fullname},</Text>

          <Text style={text}>
            Great news! Your free ticket order has been confirmed. You're all
            set to attend CoinfestAsia!
          </Text>

          <Section style={infoSection}>
            <Text style={infoLabel}>Order ID:</Text>
            <Text style={infoValue}>{orderId}</Text>

            <Text style={infoLabel}>Order Date:</Text>
            <Text style={infoValue}>{formattedDate}</Text>

            <Text style={infoLabel}>Total Amount:</Text>
            <Text style={infoValue}>FREE</Text>
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={orderUrl}>
              View Order Details
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            You will receive your tickets shortly. Please check your email for
            further instructions.
          </Text>

          <Text style={footer}>
            If you have any questions, please don't hesitate to contact our
            support team.
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

const buttonSection = {
  padding: "24px 40px",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#007bff",
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
