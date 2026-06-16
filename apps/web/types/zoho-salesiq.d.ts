declare global {
  type ZohoSalesIQVisitorName = {
    firstname: string;
    lastname?: string;
    salutation?: "Mr" | "Ms" | "Mrs" | "Prof" | "Dr" | "None";
  };

  type ZohoSalesIQVisitor = {
    id?: (visitorId: string) => void;
    email?: (email: string) => void;
    name?: (name: ZohoSalesIQVisitorName) => void;
    info?: (info: Record<string, string>) => void;
  };

  type ZohoSalesIQ = {
    widgetcode?: string;
    values?: Record<string, unknown>;
    ready?: (...args: unknown[]) => void;
    language?: (language: string) => void;
    reset?: () => void;
    visitor?: ZohoSalesIQVisitor;
  };

  interface Window {
    $zoho?: {
      salesiq?: ZohoSalesIQ;
    };
    __welpcoApplySalesIqVisitor?: () => void;
    __welpcoSalesIqReadyInstalled?: boolean;
  }
}

export {};
