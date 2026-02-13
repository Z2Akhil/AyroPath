import Link from "next/link";
import Hero from "@/components/home/Hero";
import HomeCarousel from "@/components/home/HomeCarousel";
import ProfilePage from "./profiles/page";
import OfferPage from "./offers/page";
import TestPage from "./tests/page";

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto sm:px-6 py-10">
      <Hero />

      {/* Packages Section */}
      <div className="mb-8">
        <ProfilePage limit={4} />
        <div className="text-right px-4 sm:px-6">
          <Link href="/profiles" className="text-blue-600 hover:underline font-medium">
            See More
          </Link>
        </div>
      </div>

      {/* Offers Section */}
      <div className="mb-8">
        <OfferPage limit={8} />
        <div className="text-right px-4 sm:px-6">
          <Link href="/offers" className="text-blue-600 hover:underline font-medium">
            See More
          </Link>
        </div>
      </div>

      {/* Tests Section */}
      <div className="mb-8">
        <TestPage limit={8} />
        <div className="text-right px-4 sm:px-6">
          <Link href="/tests" className="text-blue-600 hover:underline font-medium">
            See More
          </Link>
        </div>
      </div>

      <HomeCarousel />
    </div>
  );
}
