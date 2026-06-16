"use client";

import { useEffect, useMemo } from "react";
import Script from "next/script";
import { useSession } from "next-auth/react";

const IDENTIFIED_MARKER = "welpco:salesiq:identified";
const SUPPORTED_LANGUAGES = new Set(["en", "fr"]);
const DEBUG_ENABLED = process.env.NODE_ENV !== "production";
const DEBUG_PREFIX = "[Zoho SalesIQ]";

type ZohoSalesIQProviderProps = {
  locale: string;
};

type SalesIQConfig = {
  enabled: boolean;
  scriptSrc: string;
  widgetCode: string;
};

function readConfig(): SalesIQConfig {
  const enabled = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_ENABLED === "true";
  const widgetCode = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_WIDGET_CODE?.trim() ?? "";
  const scriptSrc = process.env.NEXT_PUBLIC_ZOHO_SALESIQ_SCRIPT_SRC?.trim() ?? "";

  return {
    enabled: enabled && widgetCode.length > 0 && scriptSrc.length > 0,
    scriptSrc,
    widgetCode,
  };
}

function debug(message: string, details?: Record<string, unknown>): void {
  if (!DEBUG_ENABLED) return;
  if (details) {
    console.debug(DEBUG_PREFIX, message, details);
    return;
  }
  console.debug(DEBUG_PREFIX, message);
}

function warn(message: string, details?: Record<string, unknown>): void {
  if (!DEBUG_ENABLED) return;
  if (details) {
    console.warn(DEBUG_PREFIX, message, details);
    return;
  }
  console.warn(DEBUG_PREFIX, message);
}

function ensureSalesIQ(widgetCode: string): ZohoSalesIQ {
  window.$zoho = window.$zoho || {};
  window.$zoho.salesiq = window.$zoho.salesiq || {
    widgetcode: widgetCode,
    values: {},
    ready: function ready() {},
  };
  window.$zoho.salesiq.widgetcode = widgetCode;
  window.$zoho.salesiq.values = window.$zoho.salesiq.values || {};
  return window.$zoho.salesiq;
}

function splitDisplayName(displayName: string): ZohoSalesIQVisitorName | null {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;

  const [firstname, ...rest] = parts;
  return {
    firstname,
    ...(rest.length > 0 ? { lastname: rest.join(" ") } : {}),
    salutation: "None",
  };
}

export function ZohoSalesIQProvider({ locale }: ZohoSalesIQProviderProps) {
  const { data: session, status } = useSession();
  const config = useMemo(() => readConfig(), []);
  const language = SUPPORTED_LANGUAGES.has(locale) ? locale : "en";

  useEffect(() => {
    debug("provider mounted", {
      enabled: config.enabled,
      locale,
      language,
      hasWidgetCode: config.widgetCode.length > 0,
      widgetCodeLength: config.widgetCode.length,
      hasScriptSrc: config.scriptSrc.length > 0,
      scriptSrc: config.scriptSrc || null,
      sessionStatus: status,
    });

    if (!config.enabled) {
      warn("widget is disabled or missing required public env vars", {
        enabledFlag: process.env.NEXT_PUBLIC_ZOHO_SALESIQ_ENABLED,
        hasWidgetCode: config.widgetCode.length > 0,
        hasScriptSrc: config.scriptSrc.length > 0,
      });
    }
  }, [
    config.enabled,
    config.scriptSrc,
    config.widgetCode.length,
    language,
    locale,
    status,
  ]);

  useEffect(() => {
    if (!config.enabled) return;

    const applyVisitor = () => {
      const salesiq = ensureSalesIQ(config.widgetCode);
      debug("applying visitor state", {
        sessionStatus: status,
        hasVisitorApi: Boolean(salesiq.visitor),
        hasLanguageApi: typeof salesiq.language === "function",
        hasResetApi: typeof salesiq.reset === "function",
      });

      if (typeof salesiq.language === "function") {
        salesiq.language(language);
        debug("language applied", { language });
      }

      if (status === "loading") return;

      if (status === "authenticated" && session?.user?.id) {
        const visitor = salesiq.visitor;
        visitor?.id?.(session.user.id);
        debug("visitor id applied", { userId: session.user.id });

        if (session.user.email) {
          visitor?.email?.(session.user.email);
          debug("visitor email applied", { hasEmail: true });
        }

        if (session.user.name) {
          const visitorName = splitDisplayName(session.user.name);
          if (visitorName) {
            visitor?.name?.(visitorName);
            debug("visitor name applied", {
              hasFirstname: Boolean(visitorName.firstname),
              hasLastname: Boolean(visitorName.lastname),
            });
          }
        }

        if (session.user.role) {
          visitor?.info?.({ welpcoRole: session.user.role });
          debug("visitor info applied", { welpcoRole: session.user.role });
        }

        window.localStorage.setItem(IDENTIFIED_MARKER, "true");
        debug("identified marker stored");
        return;
      }

      if (
        status === "unauthenticated" &&
        window.localStorage.getItem(IDENTIFIED_MARKER) === "true" &&
        typeof salesiq.reset === "function"
      ) {
        salesiq.reset();
        window.localStorage.removeItem(IDENTIFIED_MARKER);
        debug("stale visitor identity reset");
      }
    };

    window.__welpcoApplySalesIqVisitor = applyVisitor;

    const salesiq = ensureSalesIQ(config.widgetCode);
    debug("salesiq global ensured", {
      hasReady: typeof salesiq.ready === "function",
      hasWidgetCode: Boolean(salesiq.widgetcode),
    });

    if (!window.__welpcoSalesIqReadyInstalled) {
      const previousReady = salesiq.ready;
      salesiq.ready = (...args: unknown[]) => {
        debug("salesiq ready callback fired");
        previousReady?.(...args);
        window.__welpcoApplySalesIqVisitor?.();
      };
      window.__welpcoSalesIqReadyInstalled = true;
      debug("salesiq ready callback installed");
    }

    applyVisitor();
  }, [
    config.enabled,
    config.widgetCode,
    language,
    session?.user?.email,
    session?.user?.id,
    session?.user?.name,
    session?.user?.role,
    status,
  ]);

  if (!config.enabled) return null;

  const initScript = `
    window.$zoho = window.$zoho || {};
    window.$zoho.salesiq = window.$zoho.salesiq || {
      widgetcode: ${JSON.stringify(config.widgetCode)},
      values: {},
      ready: function() {}
    };
    window.$zoho.salesiq.widgetcode = ${JSON.stringify(config.widgetCode)};
    window.$zoho.salesiq.values = window.$zoho.salesiq.values || {};
  `;

  return (
    <>
      <Script
        id="welpco-zoho-salesiq-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: initScript }}
      />
      <Script
        id="welpco-zoho-salesiq-loader"
        src={config.scriptSrc}
        strategy="lazyOnload"
        onLoad={() => {
          debug("loader script loaded", { scriptSrc: config.scriptSrc });
          window.__welpcoApplySalesIqVisitor?.();
        }}
        onError={() => {
          warn("loader script failed", { scriptSrc: config.scriptSrc });
        }}
      />
    </>
  );
}
