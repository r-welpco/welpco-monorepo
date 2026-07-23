"use client";

import styles from "./page.module.css";

export function EmailHtmlPreview({ html }: { html: string }) {
  return (
    <iframe
      title="Email HTML preview"
      className={styles.previewFrame}
      sandbox=""
      srcDoc={html}
      referrerPolicy="no-referrer"
    />
  );
}
