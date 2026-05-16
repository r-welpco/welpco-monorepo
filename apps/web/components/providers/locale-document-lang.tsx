"use client";

import { useEffect } from "react";

/** Syncs `<html lang>` for routes under `app/[locale]/`. */
export function LocaleDocumentLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
