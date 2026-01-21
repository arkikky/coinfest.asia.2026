import type { FormOption } from "@/types/hubspots/form.types";

// @constants(hubspot)
export const HUBSPOT_FORM_ID = "d37a45c6-8478-43db-b178-c13397afff13";
export const HUBSPOT_API_URL = "https://api.hubapi.com/marketing/v3/forms";

// @constants(cache)
export const CACHE_KEYS = {
  FIELDS: "job_title_position",
} as const;

export const CACHE_DURATION = {
  ONE_HOUR: 1000 * 60 * 60,
  ONE_DAY: 1000 * 60 * 60 * 24,
} as const;

// @fallback(company size options)
export const FALLBACK_OPTIONS: FormOption[] = [
  {
    value: "Account Executive",
    label: "Account Executive",
  },
  {
    value: "Account Manager",
    label: "Account Manager",
  },
  {
    value: "Account Representative",
    label: "Account Representative",
  },
  {
    value: "Accountant",
    label: "Accountant",
  },
  {
    value: "Accounting Analyst",
    label: "Accounting Analyst",
  },
  {
    value: "Accounting Director",
    label: "Accounting Director",
  },
  {
    value: "Accounts Payable/Receivable Clerk",
    label: "Accounts Payable/Receivable Clerk",
  },
  {
    value: "Actor",
    label: "Actor",
  },
  {
    value: "Administrative Analyst",
    label: "Administrative Analyst",
  },
  {
    value: "Administrative Assistant",
    label: "Administrative Assistant",
  },
  {
    value: "Administrative Manager",
    label: "Administrative Manager",
  },
  {
    value: "Administrative Specialist",
    label: "Administrative Specialist",
  },
  {
    value: "Administrator",
    label: "Administrator",
  },
  {
    value: "Application Developer",
    label: "Application Developer",
  },
  {
    value: "Area Sales Manager",
    label: "Area Sales Manager",
  },
  {
    value: "Artificial Intelligence Engineer",
    label: "Artificial Intelligence Engineer",
  },
  {
    value: "Artist",
    label: "Artist",
  },
  {
    value: "Assistant Engineer",
    label: "Assistant Engineer",
  },
  {
    value: "Assistant Manager",
    label: "Assistant Manager",
  },
  {
    value: "Auditing Clerk",
    label: "Auditing Clerk",
  },
  {
    value: "Auditor",
    label: "Auditor",
  },
  {
    value: "B2B Sales Specialist",
    label: "B2B Sales Specialist",
  },
  {
    value: "Benefits Manager",
    label: "Benefits Manager",
  },
  {
    value: "Bookkeeper",
    label: "Bookkeeper",
  },
  {
    value: "Branch Manager",
    label: "Branch Manager",
  },
  {
    value: "Brand Manager",
    label: "Brand Manager",
  },
  {
    value: "Brand Strategist",
    label: "Brand Strategist",
  },
  {
    value: "Budget Analyst",
    label: "Budget Analyst",
  },
  {
    value: "Business Analyst",
    label: "Business Analyst",
  },
  {
    value: "Business Manager",
    label: "Business Manager",
  },
  {
    value: "CCO—Chief Customer Officer",
    label: "CCO—Chief Customer Officer",
  },
  {
    value: "CDO—Chief Data Officer",
    label: "CDO—Chief Data Officer",
  },
  {
    value: "CEO—Chief Executive Officer",
    label: "CEO—Chief Executive Officer",
  },
  {
    value: "CFO—Chief Financial Officer",
    label: "CFO—Chief Financial Officer",
  },
  {
    value: "Chief Engineer",
    label: "Chief Engineer",
  },
  {
    value: "CHRO—Chief Human Resources Officer",
    label: "CHRO—Chief Human Resources Officer",
  },
  {
    value: "CIO—Chief Information Officer",
    label: "CIO—Chief Information Officer",
  },
  {
    value: "Client Service Specialist",
    label: "Client Service Specialist",
  },
  {
    value: "Cloud Architect",
    label: "Cloud Architect",
  },
  {
    value: "CMO—Chief Marketing Officer",
    label: "CMO—Chief Marketing Officer",
  },
  {
    value: "Co-Founder",
    label: "Co-Founder",
  },
  {
    value: "Commercial Loan Officer",
    label: "Commercial Loan Officer",
  },
  {
    value: "Communications Director",
    label: "Communications Director",
  },
  {
    value: "Computer Programmer",
    label: "Computer Programmer",
  },
  {
    value: "Computer Scientist",
    label: "Computer Scientist",
  },
  {
    value: "Content Creator",
    label: "Content Creator",
  },
  {
    value: "Content Marketing Manager",
    label: "Content Marketing Manager",
  },
  {
    value: "Content Strategist",
    label: "Content Strategist",
  },
  {
    value: "Continuous Improvement Consultant",
    label: "Continuous Improvement Consultant",
  },
  {
    value: "Continuous Improvement Lead",
    label: "Continuous Improvement Lead",
  },
  {
    value: "Controller",
    label: "Controller",
  },
  {
    value: "COO—Chief Operating Officer",
    label: "COO—Chief Operating Officer",
  },
  {
    value: "Copy Editor",
    label: "Copy Editor",
  },
  {
    value: "Copywriter",
    label: "Copywriter",
  },
  {
    value: "Counselor",
    label: "Counselor",
  },
  {
    value: "CPO—Chief Product Officer",
    label: "CPO—Chief Product Officer",
  },
  {
    value: "Credit Authorizer",
    label: "Credit Authorizer",
  },
  {
    value: "Credit Counselor",
    label: "Credit Counselor",
  },
  {
    value: "CTO—Chief Technology Officer",
    label: "CTO—Chief Technology Officer",
  },
  {
    value: "Customer Care Associate",
    label: "Customer Care Associate",
  },
  {
    value: "Customer Service Manager",
    label: "Customer Service Manager",
  },
  {
    value: "Customer Support",
    label: "Customer Support",
  },
  {
    value: "Data Analyst",
    label: "Data Analyst",
  },
  {
    value: "Data Entry",
    label: "Data Entry",
  },
  {
    value: "DevOps Engineer",
    label: "DevOps Engineer",
  },
  {
    value: "Digital Marketing Manager",
    label: "Digital Marketing Manager",
  },
  {
    value: "Direct Salesperson",
    label: "Direct Salesperson",
  },
  {
    value: "Director",
    label: "Director",
  },
  {
    value: "Director of Inside Sales",
    label: "Director of Inside Sales",
  },
  {
    value: "Drafter",
    label: "Drafter",
  },
  {
    value: "eCommerce Marketing Specialist",
    label: "eCommerce Marketing Specialist",
  },
  {
    value: "Economist",
    label: "Economist",
  },
  {
    value: "Editor/Proofreader",
    label: "Editor/Proofreader",
  },
  {
    value: "Executive Assistant",
    label: "Executive Assistant",
  },
  {
    value: "File Clerk",
    label: "File Clerk",
  },
  {
    value: "Finance Director",
    label: "Finance Director",
  },
  {
    value: "Finance Manager",
    label: "Finance Manager",
  },
  {
    value: "Financial Analyst",
    label: "Financial Analyst",
  },
  {
    value: "Financial Planner",
    label: "Financial Planner",
  },
  {
    value: "Financial Services Representative",
    label: "Financial Services Representative",
  },
  {
    value: "Founder",
    label: "Founder",
  },
  {
    value: "Graphic Designer",
    label: "Graphic Designer",
  },
  {
    value: "Help Desk Worker/Desktop Support",
    label: "Help Desk Worker/Desktop Support",
  },
  {
    value: "Human Resources",
    label: "Human Resources",
  },
  {
    value: "Information Security Analyst",
    label: "Information Security Analyst",
  },
  {
    value: "IT Manager",
    label: "IT Manager",
  },
  {
    value: "IT Professional",
    label: "IT Professional",
  },
  {
    value: "Journalist",
    label: "Journalist",
  },
  {
    value: "Manager",
    label: "Manager",
  },
  {
    value: "Market Development Manager",
    label: "Market Development Manager",
  },
  {
    value: "Market Researcher",
    label: "Market Researcher",
  },
  {
    value: "Marketing Communications Manager",
    label: "Marketing Communications Manager",
  },
  {
    value: "Marketing Consultant",
    label: "Marketing Consultant",
  },
  {
    value: "Marketing Director",
    label: "Marketing Director",
  },
  {
    value: "Marketing Manager",
    label: "Marketing Manager",
  },
  {
    value: "Marketing Research Analyst",
    label: "Marketing Research Analyst",
  },
  {
    value: "Marketing Specialist",
    label: "Marketing Specialist",
  },
  {
    value: "Media Buyer",
    label: "Media Buyer",
  },
  {
    value: "Media Relations Coordinator",
    label: "Media Relations Coordinator",
  },
  {
    value: "Merchandising Associate",
    label: "Merchandising Associate",
  },
  {
    value: "Musician",
    label: "Musician",
  },
  {
    value: "Network Administrator",
    label: "Network Administrator",
  },
  {
    value: "Office Assistant",
    label: "Office Assistant",
  },
  {
    value: "Office Clerk",
    label: "Office Clerk",
  },
  {
    value: "Office Manager",
    label: "Office Manager",
  },
  {
    value: "Operations Analyst",
    label: "Operations Analyst",
  },
  {
    value: "Operations Assistant",
    label: "Operations Assistant",
  },
  {
    value: "Operations Coordinator",
    label: "Operations Coordinator",
  },
  {
    value: "Operations Director",
    label: "Operations Director",
  },
  {
    value: "Operations Manager",
    label: "Operations Manager",
  },
  {
    value: "Operations Professional",
    label: "Operations Professional",
  },
  {
    value: "Outside Sales Manager",
    label: "Outside Sales Manager",
  },
  {
    value: "Payroll Manager",
    label: "Payroll Manager",
  },
  {
    value: "President",
    label: "President",
  },
  {
    value: "Principal",
    label: "Principal",
  },
  {
    value: "Product Manager",
    label: "Product Manager",
  },
  {
    value: "Production Engineer",
    label: "Production Engineer",
  },
  {
    value: "Program Administrator",
    label: "Program Administrator",
  },
  {
    value: "Program Manager",
    label: "Program Manager",
  },
  {
    value: "Public Relations Specialist",
    label: "Public Relations Specialist",
  },
  {
    value: "Quality Control Coordinator",
    label: "Quality Control Coordinator",
  },
  {
    value: "Real Estate Broker",
    label: "Real Estate Broker",
  },
  {
    value: "Research Assistant",
    label: "Research Assistant",
  },
  {
    value: "Researcher",
    label: "Researcher",
  },
  {
    value: "Retail Worker",
    label: "Retail Worker",
  },
  {
    value: "Risk Manager",
    label: "Risk Manager",
  },
  {
    value: "Student",
    label: "Student",
  },
  {
    value: "Sales Analyst",
    label: "Sales Analyst",
  },
  {
    value: "Sales Associate",
    label: "Sales Associate",
  },
  {
    value: "Sales Manager",
    label: "Sales Manager",
  },
  {
    value: "Sales Representative",
    label: "Sales Representative",
  },
  {
    value: "Scrum Master",
    label: "Scrum Master",
  },
  {
    value: "Secretary",
    label: "Secretary",
  },
  {
    value: "SEO Manager",
    label: "SEO Manager",
  },
  {
    value: "Social Media Assistant",
    label: "Social Media Assistant",
  },
  {
    value: "Social Media Specialist",
    label: "Social Media Specialist",
  },
  {
    value: "Software Engineer",
    label: "Software Engineer",
  },
  {
    value: "SQL Developer",
    label: "SQL Developer",
  },
  {
    value: "Superintendent",
    label: "Superintendent",
  },
  {
    value: "Supervisor",
    label: "Supervisor",
  },
  {
    value: "Team Leader",
    label: "Team Leader",
  },
  {
    value: "Technical Specialist",
    label: "Technical Specialist",
  },
  {
    value: "Technical Support Specialist",
    label: "Technical Support Specialist",
  },
  {
    value: "Translator",
    label: "Translator",
  },
  {
    value: "UX Designer & UI Developer",
    label: "UX Designer &amp; UI Developer",
  },
  {
    value: "Vice President of Marketing",
    label: "Vice President of Marketing",
  },
  {
    value: "Vice President of Operations",
    label: "Vice President of Operations",
  },
  {
    value: "Video Editor",
    label: "Video Editor",
  },
  {
    value: "Video Game Writer",
    label: "Video Game Writer",
  },
  {
    value: "Video or Film Producer",
    label: "Video or Film Producer",
  },
  {
    value: "Virtual Assistant",
    label: "Virtual Assistant",
  },
  {
    value: "Web Designer",
    label: "Web Designer",
  },
  {
    value: "Web Developer",
    label: "Web Developer",
  },
];
