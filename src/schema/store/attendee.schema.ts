import * as z from "zod";

// @schema(single attendee)
export const SingleAttendeeSchema = z
  .object({
    first_name: z
      .string()
      .min(1, "First name is required!")
      .regex(/^[A-Za-z\s]+$/, "First name must contain only letters."),
    last_name: z
      .string()
      .min(1, "Last name is required!")
      .regex(/^[A-Za-z\s]+$/, "Last name must contain only letters."),
    email: z
      .string()
      .min(1, "Email address is required!")
      .regex(
        /^(?!.*\s)[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/,
        "Email address is invalid format!"
      )
      .email("Invalid email format!"),
    country: z
      .string()
      .min(1, "Country is required!")
      .regex(/^[A-Za-z\s]+$/, "Country must contain only letters.")
      .optional(),
    social_accounts: z
      .array(
        z.object({
          socialmedia: z.string().min(1, "Social media account is required!"),
          url: z.string().min(1, "Social media account is required!"),
        })
      )
      .superRefine((items, ctx) => {
        items.forEach((item, idx) => {
          if (!item?.url || item?.url?.trim()?.length === 0) {
            const label =
              (item?.socialmedia || "").replace(/\?/g, "").trim() ||
              "this question";
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [idx, "url"],
              message: `${label} is required!`,
            });
          } else if (
            item?.url &&
            !/^(https?:\/\/)[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(
              item.url.trim()
            )
          ) {
            const label =
              (item?.socialmedia || "").replace(/\?/g, "").trim() ||
              "this question";
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [idx, "url"],
              message: `${label} must be a valid url (https://...)`,
            });
          }
        });
      })
      .optional(),
    custom_questions: z
      .array(
        z.object({
          question: z.string().min(1),
          answer: z.string().optional(),
        })
      )
      .superRefine((items, ctx) => {
        items.forEach((item, idx) => {
          if (!item?.answer || item?.answer?.trim()?.length === 0) {
            const label =
              (item?.question || "").replace(/\?/g, "").trim() ||
              "this question";
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [idx, "answer"],
              message: `${label} is required!`,
            });
          } else if (
            item?.answer &&
            /^(https?:\/\/)/.test(item.answer.trim()) &&
            !/^(https?:\/\/)[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(
              item.answer.trim()
            )
          ) {
            const label =
              (item?.question || "").replace(/\?/g, "").trim() ||
              "this question";
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [idx, "answer"],
              message: `${label} must be a valid url (https://...)`,
            });
          }
        });
      })
      .default([
        {
          question:
            "What type of connections and networking do you hope to achieve at the event?",
          answer: "",
        },
        {
          question: "Where did you hear about Coinfest Asia 2025?",
          answer: "",
        },
      ]),
    is_working_with_company: z.boolean().optional().nullable(),
    company_name: z.string().nullable().optional(),
    position: z.string().optional().or(z.literal("")),
    company_website: z.string().optional().or(z.literal("")),
    company_focus: z.string().optional().or(z.literal("")),
    company_size: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data?.email && data?.email?.trim() !== "") {
        return z.string().email().safeParse(data?.email).success;
      }
      return true;
    },
    {
      message: "Invalid email format!",
      path: ["email"],
    }
  )
  .refine(
    (data) => {
      if (!data?.is_working_with_company) return true;
      const companyName = data?.company_name;
      return typeof companyName === "string" && companyName.trim().length > 0;
    },
    {
      message: "Company name is required!",
      path: ["company_name"],
    }
  )
  .refine(
    (data) => {
      if (!data?.is_working_with_company) return true;
      const companyName = data?.company_name;
      return (
        typeof companyName === "string" &&
        /^[A-Za-z\s]+$/.test(companyName.trim())
      );
    },
    {
      message: "Company name must contain only letters.",
      path: ["company_name"],
    }
  )
  .refine(
    (data) => {
      if (!data?.is_working_with_company) return true;
      const companyWebsite = data?.company_website;
      return (
        typeof companyWebsite === "string" && companyWebsite.trim().length > 0
      );
    },
    {
      message: "Company website is required!",
      path: ["company_website"],
    }
  )
  .refine(
    (data) => {
      if (!data?.is_working_with_company) return true;
      const companyWebsite = data?.company_website;
      return (
        typeof companyWebsite === "string" &&
        /^(https?:\/\/)[\w.-]+\.[A-Za-z]{2,}(\/.*)?$/.test(
          companyWebsite.trim()
        )
      );
    },
    {
      message: "Company website must be a valid url (https://...)",
      path: ["company_website"],
    }
  )
  .refine(
    (data) => {
      if (!data?.is_working_with_company) return true;
      const position = data?.position;
      return typeof position === "string" && position.trim().length > 0;
    },
    {
      message: "Position is required!",
      path: ["position"],
    }
  )
  .refine(
    (data) => {
      if (!data?.is_working_with_company) return true;
      const focus = data?.company_focus;
      return typeof focus === "string" && focus.trim().length > 0;
    },
    {
      message: "Company focus is required!",
      path: ["company_focus"],
    }
  )
  .refine(
    (data) => {
      if (!data?.is_working_with_company) return true;
      const size = data?.company_size;
      return typeof size === "string" && size.trim().length > 0;
    },
    {
      message: "Company size is required!",
      path: ["company_size"],
    }
  );

// @schema(attendee form)
export const AttendeeFormSchema = z.object({
  attendees: z
    .array(SingleAttendeeSchema)
    .min(1, "At least one attendee is required"),
});

// @schema(agreement)
export const AgreementSchema = z.object({
  agreement: z.literal(true, {
    message: "You must agree before continuing",
  }),
});

// @types(export)
export type SingleAttendee = z.infer<typeof SingleAttendeeSchema>;
export type AttendeeFormValues = z.infer<typeof AttendeeFormSchema>;
export type Agreement = z.infer<typeof AgreementSchema>;
