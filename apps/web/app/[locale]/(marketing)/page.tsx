import { HeroImmersive } from "@/components/features/marketing/hero/hero-immersive";
import { CategoriesGrid } from "@/components/features/marketing/sections/categories-grid";
import { HowItWorks } from "@/components/features/marketing/sections/how-it-works";
// MinorsBanner intentionally not rendered: signup currently hard-rejects
// under-18 welpers (MINOR_SIGNUP_UNAVAILABLE) — re-add when the guardian
// flow opens (adoption report C4).
import { WelpersNearYou } from "@/components/features/marketing/sections/welpers-near-you";
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
      {/* Real social proof: live profiles from public search; renders nothing
          below its honesty threshold (see welpers-near-you.tsx). */}
      <WelpersNearYou />
      <CategoriesGrid />
      <HowItWorks />
      <TrustSafety />
      <BecomeWelperCTA />
      <FAQTeaser />
    </>
  );
}
