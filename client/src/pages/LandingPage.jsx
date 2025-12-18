import Hero from '../sections/Hero';
import HomeCarousel from '../sections/HomeCarousel';
import PackagePage from './PackagePage';
import OfferPage from './OfferPage';
import TestPage from './TestPage';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const LandingPage = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": "Ayropath",
    "url": "https://ayropath.com",
    "description": "Ayropath is a trusted platform to book medical tests, blood tests and health packages powered by Thyrocare across India.",
    "logo": "https://ayropath.com/logo.jpg",
    "image": "https://ayropath.com/og-image.png",
    "areaServed": "India",
    "brand": {
      "@type": "Brand",
      "name": "Ayropath"
    }
  };

  return (
    <div className="max-w-7xl mx-auto sm:px-6 py-10">
      <SEO structuredData={structuredData} />
      <Hero />

      {/* Packages Section */}
      <div className="mb-8">
        <PackagePage limit={4} />
        <div className="text-right ">
          <Link to="/packages" className="text-blue-600 hover:underline font-medium px-1">
            See More
          </Link>
        </div>
      </div>

      {/* Offers Section */}
      <div className="mb-8">
        <OfferPage limit={8} />
        <div className="text-right">
          <Link to="/offers" className="text-blue-600 hover:underline font-medium px-1">
            See More
          </Link>
        </div>
      </div>

      {/* Tests Section */}
      <div className="mb-8">
        <TestPage limit={8} />
        <div className="text-right">
          <Link to="/tests" className="text-blue-600 hover:underline font-medium px-1">
            See More
          </Link>
        </div>
      </div>
      <HomeCarousel />
    </div>
  );
};

export default LandingPage;
