import Navbar          from "@/components/Navbar";
import Hero            from "@/components/Hero";
import CategoryGrid    from "@/components/CategoryGrid";
import WhyUs           from "@/components/WhyUs";
import HowItWorks      from "@/components/HowItWorks";
import PromoCards      from "@/components/PromoCards";
import Testimonials    from "@/components/Testimonials";
import TrustStats      from "@/components/TrustStats";
import PopularCalculators from "@/components/PopularCalculators";
import AlsoBuy         from "@/components/AlsoBuy";
import Footer          from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <CategoryGrid />
      <WhyUs />
      <HowItWorks />
      <PromoCards />
      <Testimonials />
      <TrustStats />
      <PopularCalculators />
      <AlsoBuy />
      <Footer />
    </>
  );
}
