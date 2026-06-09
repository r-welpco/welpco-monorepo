import { getLocale } from "next-intl/server";
import { getCodeOfConductDocument } from "@/lib/legal/get-legal-document";
import type { Locale } from "@/i18n/routing";
import { LegalTermsDocumentView } from "./legal-document-page";

export async function CodeOfConductPageContent({
  locale: localeProp,
}: { locale?: Locale } = {}) {
  const locale = localeProp ?? ((await getLocale()) as Locale);
  const doc = getCodeOfConductDocument(locale);

  return (
    <LegalTermsDocumentView
      title={doc.hero.title}
      intro={doc.hero.intro}
      sections={doc.sections}
    />
  );
}

export async function getCodeOfConductMetadata(locale?: Locale) {
  const resolved = locale ?? ((await getLocale()) as Locale);
  return getCodeOfConductDocument(resolved).meta;
}
