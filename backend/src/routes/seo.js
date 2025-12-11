import express from 'express';
import Test from '../models/Test.js';
import Profile from '../models/Profile.js';
import Offer from '../models/Offer.js';

const router = express.Router();

/**
 * Serve robots.txt
 * This blocks backend API and admin routes from search engines
 */
router.get('/robots.txt', (req, res) => {
  const robotsTxt = `# Robots.txt for AyroPath
User-agent: *

# Allow all client pages
Allow: /

# Disallow backend API routes
Disallow: /api/

# Disallow admin panel
Disallow: /admin/

# Sitemap location
Sitemap: ${process.env.CLIENT_URL || 'https://ayropath.com'}/sitemap.xml
`;

  res.type('text/plain');
  res.send(robotsTxt);
});

/**
 * Generate and serve sitemap.xml
 * Includes static pages and dynamic product pages
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'https://ayropath.com';
    
    // Static pages with priority and change frequency
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/packages', priority: '0.9', changefreq: 'daily' },
      { url: '/tests', priority: '0.9', changefreq: 'daily' },
      { url: '/offers', priority: '0.8', changefreq: 'daily' },
      { url: '/about', priority: '0.7', changefreq: 'monthly' },
    ];

    // Fetch all active products from database
    const [tests, profiles, offers] = await Promise.all([
      Test.find({ isActive: true }).select('code updatedAt'),
      Profile.find({ isActive: true }).select('code updatedAt'),
      Offer.find({ isActive: true }).select('code updatedAt')
    ]);

    // Build XML sitemap
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}${page.url}</loc>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += '  </url>\n';
    });

    // Add dynamic product pages (packages)
    const allProducts = [...profiles, ...offers, ...tests];
    allProducts.forEach(product => {
      const lastmod = product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : '';
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}/packages/${product.code}</loc>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      if (lastmod) {
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
      }
      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';

    res.type('application/xml');
    res.send(sitemap);

  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
});

export default router;
