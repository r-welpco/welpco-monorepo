export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "subsection"; id: string; title: string; blocks: LegalBlock[] };

export type LegalPrivacySection = {
  numeral: string;
  id?: string;
  title: string;
  intro?: string;
  list?: string[];
  paragraphs?: string[];
  companyLine?: string;
  contactEmail?: boolean;
};

export type LegalTermsSection = {
  numeral: string;
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalPrivacyDocument = {
  meta: { title: string; description: string };
  hero: { title: string; subtitle: string };
  sections: LegalPrivacySection[];
};

export type LegalTermsDocument = {
  meta: { title: string; description: string };
  hero: {
    title: string;
    lastUpdated?: string;
    notice?: string;
    intro?: string;
  };
  sections: LegalTermsSection[];
};

export type LegalPolicyDocument = {
  meta: { title: string; description: string };
  hero: { title: string; subtitle?: string };
  paragraphs: string[];
};

export type LegalDocumentKind =
  | "privacy"
  | "terms"
  | "refund"
  | "cancellation"
  | "codeOfConduct";
