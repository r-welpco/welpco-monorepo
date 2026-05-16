/**
 * Parses terms_*.txt and privacy_*.txt into apps/web/content/legal/*.json
 * Run: node apps/web/scripts/parse-legal-docs.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = path.join(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "content/legal");

function normalizeBullet(line) {
  return line.replace(/^[\t•]\s*/, "").trim();
}

function isBullet(line) {
  return /^[\t•]/.test(line);
}

function parsePrivacy(raw, locale) {
  const lines = raw.split(/\r?\n/).map((l) => l.trimEnd());
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  const titleLine = nonEmpty[0] ?? "Privacy Policy";
  const sections = [];
  let current = null;

  for (const line of nonEmpty.slice(1)) {
    const m = line.match(/^(\d+)\.\s+(.+)$/);
    if (m) {
      if (current) sections.push(current);
      current = {
        numeral: m[1].padStart(2, "0"),
        title: m[2].trim(),
        intro: undefined,
        list: [],
        paragraphs: [],
        contactEmail: false,
        companyLine: undefined,
      };
      if (m[1] === "8" && locale === "en") current.id = "cookies";
      if (m[1] === "8" && locale === "fr") current.id = "cookies";
      continue;
    }
    if (!current) continue;

    const trimmed = line.trim();
    if (isBullet(trimmed)) {
      if (!current.list) current.list = [];
      current.list.push(normalizeBullet(trimmed));
    } else if (
      current.intro &&
      current.intro.endsWith(":") &&
      !trimmed.includes("@") &&
      trimmed.length < 120 &&
      !/^[A-Z].*\.$/.test(trimmed) &&
      (current.list || !current.paragraphs?.length)
    ) {
      if (!current.list) current.list = [];
      current.list.push(trimmed);
    } else if (
      trimmed.toLowerCase().includes("support@welpco.com") ||
      trimmed === "Contact : support@welpco.com"
    ) {
      if (trimmed.includes("Welpco")) current.companyLine = trimmed.split("support")[0].trim();
      current.paragraphs.push(trimmed);
      current.contactEmail = true;
    } else if (current.list.length === 0 && !current.intro && !current.paragraphs.length) {
      current.intro = trimmed;
    } else {
      current.paragraphs.push(trimmed);
    }
  }
  if (current) sections.push(current);

  for (const s of sections) {
    if (s.list?.length === 0) delete s.list;
    if (s.paragraphs?.length === 0) delete s.paragraphs;
    delete s.contactEmail;
    if (s.title === "Contact" || s.title === "Contact") {
      s.contactEmail = true;
      if (s.paragraphs?.length === 1 && s.paragraphs[0].includes("@")) {
        delete s.paragraphs;
      }
    }
    if (locale === "fr" && s.title === "Contact") {
      s.companyLine = "Welpco inc.";
      s.contactEmail = true;
    }
  }

  const heroTitle =
    locale === "fr" ? "Politique de confidentialité" : "Privacy Policy";
  return {
    meta: {
      title:
        locale === "fr"
          ? "Welpco — Politique de confidentialité"
          : "Welpco — Privacy Policy",
      description:
        locale === "fr"
          ? "Politique de confidentialité Welpco — collecte, utilisation et protection des renseignements personnels."
          : "Welpco privacy policy — how we collect, use, and protect your personal information.",
    },
    hero: {
      title: heroTitle,
      subtitle:
        locale === "fr"
          ? "Comment nous collectons, utilisons et protégeons vos renseignements personnels."
          : "How we collect, use, and protect your personal information.",
    },
    sections,
  };
}

function parseTerms(raw, locale) {
  const lines = raw.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i++;
  const title = lines[i++]?.trim() ?? "Terms of Use";
  const lastUpdated = lines[i++]?.trim() ?? "";
  while (i < lines.length && !lines[i].trim()) i++;
  const noticeLines = [];
  while (i < lines.length) {
    const line = lines[i];
    if (/^\d+\.\s/.test(line.trim()) && !/^\d+\.\d+/.test(line.trim())) break;
    if (line.trim()) noticeLines.push(line.trim());
    i++;
  }
  const notice = noticeLines.join(" ");

  const sections = [];
  let currentSection = null;
  let currentSub = null;

  function flushSub() {
    if (!currentSub || !currentSection) return;
    currentSection.blocks.push({ type: "subsection", ...currentSub });
    currentSub = null;
  }

  function flushSection() {
    flushSub();
    if (currentSection) {
      sections.push(currentSection);
      currentSection = null;
    }
  }

  function pushParagraph(text) {
    if (currentSub) {
      currentSub.blocks.push({ type: "paragraph", text });
    } else if (currentSection) {
      currentSection.blocks.push({ type: "paragraph", text });
    }
  }

  function pushListItem(text) {
    const target = currentSub ?? currentSection;
    if (!target) return;
    const blocks = target.blocks;
    const last = blocks[blocks.length - 1];
    if (last?.type === "list") last.items.push(text);
    else blocks.push({ type: "list", items: [text] });
  }

  for (; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    const main = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (main && !/^\d+\.\d+/.test(trimmed)) {
      flushSection();
      currentSection = {
        numeral: main[1].padStart(2, "0"),
        id: `section-${main[1]}`,
        title: main[2].trim(),
        blocks: [],
      };
      continue;
    }

    const sub = trimmed.match(/^(\d+\.\d+)\.?\s+(.+)$/);
    if (sub) {
      flushSub();
      currentSub = {
        id: sub[1],
        title: sub[2].trim(),
        blocks: [],
      };
      continue;
    }

    if (isBullet(line) || isBullet(trimmed)) {
      pushListItem(normalizeBullet(line));
      continue;
    }

    // subsection title without number (FR sometimes "Paiement via fournisseur tiers")
    if (
      currentSection &&
      !currentSub &&
      trimmed.length < 80 &&
      !trimmed.endsWith(".") &&
      sections.length > 0 &&
      /^[A-ZÀ-ÿ]/.test(trimmed) &&
      !trimmed.includes("•")
    ) {
      const next = lines[i + 1]?.trim();
      if (next && (isBullet(lines[i + 1]) || next.startsWith("•"))) {
        flushSub();
        currentSub = { id: `sub-${sections.length}-${currentSection.blocks.length}`, title: trimmed, blocks: [] };
        continue;
      }
    }

    pushParagraph(trimmed);
  }
  flushSection();

  const heroTitle =
    locale === "fr" ? "Conditions d'utilisation" : "Terms of Use";
  return {
    meta: {
      title:
        locale === "fr"
          ? "Welpco — Conditions d'utilisation"
          : "Welpco — Terms of Use",
      description:
        locale === "fr"
          ? "Conditions d'utilisation de la plateforme Welpco."
          : "Welpco terms of use for the platform.",
    },
    hero: {
      title: heroTitle,
      lastUpdated,
      notice,
    },
    sections,
  };
}

function write(name, data) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2) + "\n");
}

const downloads = "/Users/rabie/Downloads";
write("privacy.en.json", parsePrivacy(fs.readFileSync(path.join(downloads, "privacy_en.txt"), "utf8"), "en"));
write("privacy.fr.json", parsePrivacy(fs.readFileSync(path.join(downloads, "privacy_fr.txt"), "utf8"), "fr"));
write("terms.en.json", parseTerms(fs.readFileSync(path.join(downloads, "terms_en.txt"), "utf8"), "en"));
write("terms.fr.json", parseTerms(fs.readFileSync(path.join(downloads, "terms_fr.txt"), "utf8"), "fr"));
console.log("Wrote legal JSON to", OUT);
