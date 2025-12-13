import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Helper for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_URL = 'https://ayropath.com';
const API_URL = process.env.VITE_TARGET_URL || 'http://localhost:3000/api';
const SITEMAP_PATH = path.resolve(__dirname, '../public/sitemap.xml');

async function generateSitemap() {
    console.log('Generating sitemap...');
    console.log(`API URL: ${API_URL}`);

    try {
        // 1. Fetch all products (Profiles, Offers, Tests)
        // We only want Profiles and Offers which have detail pages at /packages/:code
        const response = await axios.get(`${API_URL}/client/products?type=ALL`);

        if (!response.data.success) {
            throw new Error('Failed to fetch products from API');
        }

        const allProducts = response.data.products || [];

        // Filter for Profiles and Offers (assuming Tests don't have separate pages based on analysis)
        // Adjust logic if Tests are also viewable at /packages/:code
        const productsToMap = allProducts.filter(p =>
            p.type === 'PROFILE' || p.type === 'OFFER'
        );

        console.log(`Found ${productsToMap.length} products to map.`);

        // 2. Build XML
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Routes -->
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/packages</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/tests</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/offers</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;

        // 3. Add Dynamic Product Routes
        productsToMap.forEach(product => {
            // Escape special characters in URL if necessary, though codes are usually safe
            const loc = `${SITE_URL}/packages/${product.code}`;
            sitemap += `
  <url>
    <loc>${loc}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });

        sitemap += `\n</urlset>`;

        // 4. Write File
        fs.writeFileSync(SITEMAP_PATH, sitemap);
        console.log(`✅ Sitemap generated successfully at ${SITEMAP_PATH}`);

    } catch (error) {
        console.error('❌ Error generating sitemap:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   Ensure your backend server is running at ' + API_URL);
        }
        process.exit(1);
    }
}

generateSitemap();
