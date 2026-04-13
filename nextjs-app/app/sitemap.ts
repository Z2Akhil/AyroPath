import { MetadataRoute } from 'next';
import connectToDatabase from '@/lib/db/mongoose';
import Profile from '@/lib/models/Profile';
import Offer from '@/lib/models/Offer';
import Test from '@/lib/models/Test';
import { slugify } from '@/lib/slugify';
import { CITIES } from '@/lib/cityData';
import { getAllBlogSlugs } from '@/lib/mdx';

export const revalidate = 86400; // Cache for 24 hours

// The 9 priority profiles that should be crawled more frequently and with higher priority
const PRIORITY_PROFILE_NAMES = [
  'executive full body health checkup',
  'complete health checkup with vitamins',
  'aarogyam tax saver basic',
  'aarogyam tax saver advanced',
  'new aarogyam basic with ustsh',
  'aarogyam male',
  'aarogyam female',
  'senior citizen profile male',
  'senior citizen profile female',
];

function isPriorityProfile(name: string): boolean {
  const n = (name || '').toLowerCase();
  return PRIORITY_PROFILE_NAMES.some((p) => n.includes(p));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://ayropath.com';

  try {
    await connectToDatabase();

    const [profiles, offers, tests] = await Promise.all([
      Profile.find({ isActive: true }).select('name type code updatedAt').lean(),
      Offer.find({ isActive: true }).select('name type code updatedAt').lean(),
      Test.find({ isActive: true }).select('name type code updatedAt').lean()
    ]);

    const profileUrls: MetadataRoute.Sitemap = profiles.map((pkg: any) => {
      const priority = isPriorityProfile(pkg.name) ? 0.95 : 0.8;
      const changeFrequency = isPriorityProfile(pkg.name) ? 'daily' : 'weekly';
      return {
        url: `${baseUrl}/profiles/${slugify(pkg.name || 'Health Package')}/${pkg.type || 'PROFILE'}/${pkg.code}`,
        lastModified: pkg.updatedAt || new Date(),
        changeFrequency,
        priority,
      };
    });

    const offerUrls: MetadataRoute.Sitemap = offers.map((pkg: any) => ({
      url: `${baseUrl}/profiles/${slugify(pkg.name || 'Health Package')}/${pkg.type || 'OFFER'}/${pkg.code}`,
      lastModified: pkg.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const testUrls: MetadataRoute.Sitemap = tests.map((t: any) => ({
      url: `${baseUrl}/profiles/${slugify(t.name || 'Lab Test')}/${t.type || 'TEST'}/${t.code}`,
      lastModified: t.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // City-specific pillar pages — high priority, local SEO
    const cityUrls: MetadataRoute.Sitemap = CITIES.map((city) => ({
      url: `${baseUrl}/full-body-checkup/${city.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    }));

    // Blog posts
    const blogSlugs = getAllBlogSlugs();
    const blogUrls: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

    return [
      {
        url: `${baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/full-body-checkup`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.95,
      },
      {
        url: `${baseUrl}/profiles`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
      },
      {
        url: `${baseUrl}/tests`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/offers`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.75,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/lab-standards`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      },
      {
        url: `${baseUrl}/privacy-policy`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/terms-of-service`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
      {
        url: `${baseUrl}/refund-policy`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.3,
      },
      ...cityUrls,
      ...blogUrls,
      ...profileUrls,
      ...offerUrls,
      ...testUrls,
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Fallback to static routes
    return [
      {
        url: `${baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/profiles`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/tests`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/offers`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      }
    ];
  }
}
