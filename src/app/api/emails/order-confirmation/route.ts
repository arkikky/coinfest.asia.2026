import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import FreeOrderEmail from "@/emails/FreeOrderEmail";
import PaidOrderEmail from "@/emails/PaidOrderEmail";

// @types
interface EmailRequestBody {
  orderId: string;
  email: string;
  fullname: string;
  amount: number;
  isFree: boolean;
  sentAt: string;
}

// @config(nodemailer transporter)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_EMAIL_HOST || "",
    port: process.env.SMTP_EMAIL_SECURE === "true" ? 465 : 587,
    secure: process.env.SMTP_EMAIL_SECURE === "true",
    auth: {
      user: process.env.SMTP_EMAIL_USER || "",
      pass: process.env.SMTP_EMAIL_APPS || "",
    },
  });
};

// @handler(POST)
export async function POST(request: NextRequest) {
  try {
    const body: EmailRequestBody = await request.json();
    const { orderId, email, fullname, amount, isFree, sentAt } = body;

    // @validate(required fields)
    if (!orderId || !email || !fullname) {
      return NextResponse.json(
        {
          error: "Missing required fields: orderId, email, fullname",
        },
        { status: 400 }
      );
    }

    // @validate(smtp config)
    if (
      !process.env.SMTP_EMAIL_HOST ||
      !process.env.SMTP_EMAIL_USER ||
      !process.env.SMTP_EMAIL_APPS ||
      !process.env.SMTP_EMAIL_FROM
    ) {
      console.error("SMTP configuration is missing");
      return NextResponse.json(
        {
          warning: "Email configuration is missing but order was processed",
          error: "SMTP_EMAIL configuration not found",
        },
        { status: 200 } 
      );
    }

    // @prepare(email data)
    const emailData = {
      orderId,
      fullname,
      amount: isFree ? 0 : amount,
      sentAt,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/order-received?process=${orderId}`,
    };

    // @render(react email template)
    const emailHtml = isFree
      ? await render(FreeOrderEmail(emailData))
      : await render(PaidOrderEmail(emailData));

    const emailText = isFree
      ? await render(FreeOrderEmail(emailData), { plainText: true })
      : await render(PaidOrderEmail(emailData), { plainText: true });

    // @create(transporter)
    const transporter = createTransporter();

    // @send(email)
    const info = await transporter.sendMail({
      from: process.env.SMTP_EMAIL_FROM || "",
      to: email,
      subject: isFree
        ? "Order Confirmation - Free Ticket"
        : "Order Confirmation - Payment Required",
      html: emailHtml,
      text: emailText,
    });

    // @log(email sent successfully)
    {process.env.NODE_ENV === "development" && (
      console.log("Email sent successfully:", info?.messageId)
    )}

    return NextResponse.json(
      {
        success: true,
        message: isFree
          ? "Free order email sent successfully"
          : "Paid order email sent successfully",
        data: {
          messageId: info.messageId,
          accepted: info.accepted,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in email API:", error);

    // @don't(fail the order if email fails)
    return NextResponse.json(
      {
        warning: "Email processing error but order was processed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 } 
    );
  }
}
