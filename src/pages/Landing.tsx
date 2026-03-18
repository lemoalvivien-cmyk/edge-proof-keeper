import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { PainSection } from "@/components/landing/PainSection";
import { PromiseSection } from "@/components/landing/PromiseSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { GodModePreviewSection } from "@/components/landing/GodModePreviewSection";
import { EvidenceSection } from "@/components/landing/EvidenceSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { FooterSection } from "@/components/landing/FooterSection";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        {/* 1. Hero — SECURIT-E Armure de Gouvernance Cyber */}
        <HeroSection />
        {/* 2. Problème 2026 — NIS2 amendes 10M€ + responsabilité DSI */}
        <PainSection />
        {/* 3. Solution — 6 Agents IA + Swarm + Predictive Causality + Evidence Vault */}
        <PromiseSection />
        {/* 4. Démo 47s — Scout→Analyst→DSI Go→Executor→Vault */}
        <HowItWorksSection />
        {/* 5. God Mode Preview — Dashboard Live + Agents + Remédiation + Vault */}
        <GodModePreviewSection />
        {/* 6. Evidence Vault cryptographique SHA-256 */}
        <EvidenceSection />
        {/* 7. Pour qui ? */}
        <AudienceSection />
        {/* 8. Pricing — 490 / 6 900 / 29 900 */}
        <PricingSection />
        {/* 9. Trust + Testimonials */}
        <SocialProofSection />
        {/* 10. FAQ */}
        <FAQSection />
      </main>
      <FooterSection />
    </div>
  );
};

export default Landing;
