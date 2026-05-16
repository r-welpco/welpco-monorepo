export type Segment = "customer" | "welper";
export type EmailLocale = "en" | "fr";

export interface WrapEmailOptions {
  content: string;
  locale: EmailLocale;
  documentTitle: string;
  publicAppUrl?: string;
}
