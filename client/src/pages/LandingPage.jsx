import Hero from '../sections/Hero';
import HomeCarousel from '../sections/HomeCarousel';
import PackagePage from './PackagePage';
import OfferPage from './OfferPage';
import TestPage from './TestPage';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="max-w-7xl mx-auto sm:px-6 py-10">
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
