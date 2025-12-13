import express from 'express';
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
 * Dynamically generates sitemap at runtime from database
 * Includes caching for performance optimization
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.CLIENT_URL || 'https://ayropath.com';

    // Static pages with priority and change frequency
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/packages', priority: '0.8', changefreq: 'weekly' },
      { url: '/tests', priority: '0.8', changefreq: 'weekly' },
      { url: '/offers', priority: '0.8', changefreq: 'weekly' },
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
    ];

    // Fetch all active products from database
    const [profiles, offers] = await Promise.all([
      Profile.find({ isActive: true }).select('code updatedAt').lean(),
      Offer.find({ isActive: true }).select('code updatedAt').lean()
    ]);

    const allProducts = [...profiles, ...offers];

    // Log product counts for monitoring
    console.log(`📄 Generating sitemap: ${allProducts.length} products (${profiles.length} profiles, ${offers.length} offers)`);

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

    // Add dynamic product pages
    allProducts.forEach(product => {
      const lastmod = product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : '';
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}/packages/${product.code}</loc>\n`;
      sitemap += `    <priority>0.7</priority>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      if (lastmod) {
        sitemap += `    <lastmod>${lastmod}</lastmod>\n`;
      }
      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';

    // Set caching headers (cache for 1 hour)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');

    res.send(sitemap);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
});

export default router;
