import { Hero } from "@/components/hero";
import { HomeFooter } from "@/components/home-footer";

export default function Page() {
  return (
    <div className="flex flex-col">
      <Hero />
      <div className="container mx-auto max-sm:px-2">
        <div className="homepage-pattern-divider" />
        <HomeFooter />
      </div>
    </div>
  );
}
