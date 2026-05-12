import type { Decorator } from "@storybook/react-vite";

/**
 * Canonical viewport presets for responsive story variants.
 * Mirrors `BREAKPOINTS` in `packages/ui/src/tokens.ts`.
 */
export const VIEWPORTS = {
  mobile: {
    name: "Mobile (375×667)",
    styles: { width: "375px", height: "667px" },
    type: "mobile" as const,
  },
  mobileLarge: {
    name: "Mobile large (414×896)",
    styles: { width: "414px", height: "896px" },
    type: "mobile" as const,
  },
  tablet: {
    name: "Tablet (768×1024)",
    styles: { width: "768px", height: "1024px" },
    type: "tablet" as const,
  },
  desktop: {
    name: "Desktop (1280×800)",
    styles: { width: "1280px", height: "800px" },
    type: "desktop" as const,
  },
  desktopWide: {
    name: "Desktop wide (1640×900)",
    styles: { width: "1640px", height: "900px" },
    type: "desktop" as const,
  },
};

export type ViewportKey = keyof typeof VIEWPORTS;

/**
 * Use in a story's `decorators` array to lock the preview to a specific
 * viewport. The addon-viewport toolbar still lets the viewer switch —
 * this sets the default.
 *
 * @example
 * export const Mobile: Story = { parameters: { viewport: { defaultViewport: "mobile" } } };
 */
export const withViewport = (key: ViewportKey): Decorator => {
  const decorator: Decorator = (Story, context) => {
    context.parameters.viewport = {
      ...context.parameters.viewport,
      defaultViewport: key,
    };
    return <Story />;
  };
  return decorator;
};
