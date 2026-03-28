export type ApplicationStatus = "Interviewing" | "Applied" | "Screening" | "Offer";

export interface ApplicationCard {
  id: string;
  title: string;
  company: string;
  location: string;
  status: ApplicationStatus;
}

export const applications: ApplicationCard[] = [
  {
    id: "1",
    title: "Senior Product Manager",
    company: "ADGM FinTech",
    location: "Abu Dhabi",
    status: "Interviewing",
  },
  {
    id: "2",
    title: "Solutions Architect",
    company: "Emirates Digital",
    location: "Dubai",
    status: "Applied",
  },
  {
    id: "3",
    title: "Head of Operations",
    company: "MENA Logistics",
    location: "Dubai",
    status: "Screening",
  },
  {
    id: "4",
    title: "Strategy Consultant",
    company: "Gulf Advisory",
    location: "Abu Dhabi",
    status: "Offer",
  },
];

export const interviewTips = [
  "Try using more action verbs in your opening.",
  "Mention your experience with ERP systems when they ask about scale.",
  "Quantify impact: revenue, % improvement, or team size.",
  "Tie your UAE market exposure to their expansion goals.",
];

export const SAMPLE_JOB_DESCRIPTION = `We are seeking a Senior Business Analyst with strong stakeholder management and communication skills. You will lead requirements workshops, document BRDs, and work with engineering on SAP S/4HANA integrations.

Hard skills: SQL, Power BI, Agile, Jira, data modeling, ERP systems, financial reporting.
Soft skills: leadership, negotiation, cross-functional collaboration, presentation skills, adaptability.

Experience in Abu Dhabi or Dubai financial services is a plus.`;

export const OPTIMIZE_KEYWORDS = [
  "SQL",
  "Power BI",
  "SAP",
  "Agile",
  "stakeholder",
  "leadership",
  "ERP",
] as const;

export const exportRecommendations = [
  {
    id: "r1",
    title: "PMP Certification",
    subtitle: "Project Management Institute",
    kind: "cert" as const,
  },
  {
    id: "r2",
    title: "Professional noise-cancelling headset",
    subtitle: "Interview clarity",
    kind: "gear" as const,
  },
  {
    id: "r3",
    title: "Advanced Excel & Financial Modeling",
    subtitle: "Coursera / CFA prep",
    kind: "cert" as const,
  },
];
