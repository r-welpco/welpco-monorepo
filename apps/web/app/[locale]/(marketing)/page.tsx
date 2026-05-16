import { HeroImmersive } from "@/components/features/marketing/hero/hero-immersive";
import { CategoriesGrid } from "@/components/features/marketing/sections/categories-grid";
import { HowItWorks } from "@/components/features/marketing/sections/how-it-works";
import { MinorsBanner } from "@/components/features/marketing/sections/minors-banner";
import { TrustSafety } from "@/components/features/marketing/sections/trust-safety";
import { BecomeWelperCTA } from "@/components/features/marketing/sections/become-welper-cta";
import { FAQTeaser } from "@/components/features/marketing/sections/faq-teaser";

/**
 * Marketing homepage — mirrors `homepage.jsx` assembly order from the
 * design bundle. Hero is the immersive full-viewport variant only.
 */

export default function MarketingNewHomePage() {
  return (
    <>
      <HeroImmersive />
      <CategoriesGrid />
      <HowItWorks />
      <MinorsBanner />
      <TrustSafety />
      <BecomeWelperCTA />
      <FAQTeaser />
    </>
  );
}
