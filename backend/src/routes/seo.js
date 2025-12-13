import express from 'express';
import Profile from '../models/Profile.js';
import Offer from '../models/Offer.js';

const router = express.Router();

/* ---------- helpers ---------- */
const CANONICAL =
  process.env.NODE_ENV === 'production'
    ? 'https://ayropath.com'
    : 'http://localhost:5173';

/* ---------- robots.txt ---------- */
router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`# Robots.txt for AyroPath   
User-agent: *

# Allow all public pages
Allow: /

# Block API and admin routes
Disallow: /api/
Disallow: /admin/

Sitemap: ${CANONICAL}/sitemap.xml
`);
});

/* ---------- sitemap.xml ---------- */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const staticPages = [
      { url: '/',            priority: '1.0', changefreq: 'daily'  },
      { url: '/packages',    priority: '0.8', changefreq: 'weekly' },
      { url: '/tests',       priority: '0.8', changefreq: 'weekly' },
      { url: '/offers',      priority: '0.8', changefreq: 'weekly' },
      { url: '/about',       priority: '0.5', changefreq: 'monthly'},
    ];

    const [profiles, offers] = await Promise.all([
      Profile.find({ isActive: true }).select('code updatedAt').lean(),
      Offer .find({ isActive: true }).select('code updatedAt').lean(),
    ]);

    const products = [...profiles, ...offers];
    console.log(`📄 Sitemap: ${products.length} products (${profiles.length} profiles, ${offers.length} offers)`);

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    staticPages.forEach(p => {
      xml += `  <url>\n    <loc>${CANONICAL}${p.url}</loc>\n`;
      xml += `    <priority>${p.priority}</priority>\n`;
      xml += `    <changefreq>${p.changefreq}</changefreq>\n  </url>\n`;
    });

    products.forEach(p => {
      const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : '';
      xml += `  <url>\n    <loc>${CANONICAL}/packages/${p.code}</loc>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      if (lastmod) xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error('❌ Sitemap error:', err);
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
});

export default router;