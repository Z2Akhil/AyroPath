"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const Hero = () => {
  const [imgError, setImgError] = useState(false);

  // Using default hero image - site settings can be added later
  const heroImage = "/hero.webp";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden md:flex mb-12 hero-card transition-standard">
      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Trusted Lab Tests, Right at Your Home
        </h1>
        <p className="text-gray-700 text-lg mb-6">
          In association with ThyroCare, we bring NABL, CAP, and ISO certified
          lab services directly to you.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/tests"
            aria-label="Book a Lab Test"
            className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition shadow-md hover:shadow-lg active:scale-95 transition-all duration-200"
          >
            Book a Test
          </Link>
          <Link
            href="/offers"
            aria-label="View current test offers"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
          >
            View Offers
          </Link>
        </div>
      </div>

      <div className="md:w-1/2 h-64 md:h-auto min-h-[300px] relative">
        <Image
          src={heroImage}
          alt="Lab technician"
          fill
          className="object-cover"
          priority
          onError={() => setImgError(true)}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </div>
  );
};

export default Hero;
