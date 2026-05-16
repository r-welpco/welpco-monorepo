import { getLocale } from "next-intl/server";
import { getTermsDocument } from "@/lib/legal/get-legal-document";
import type { Locale } from "@/i18n/routing";
import { LegalTermsDocumentView } from "./legal-document-page";

export async function TermsPageContent({ locale: localeProp }: { locale?: Locale } = {}) {
  const locale = localeProp ?? ((await getLocale()) as Locale);
  const doc = getTermsDocument(locale);

  return (
    <LegalTermsDocumentView
      title={doc.hero.title}
      lastUpdated={doc.hero.lastUpdated}
      notice={doc.hero.notice}
      sections={doc.sections}
    />
  );
}

export async function getTermsMetadata(locale?: Locale) {
  const resolved = locale ?? ((await getLocale()) as Locale);
  return getTermsDocument(resolved).meta;
}
