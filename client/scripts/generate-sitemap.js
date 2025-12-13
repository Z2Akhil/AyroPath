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

    let productsToMap = [];

    // 1. Try to fetch products (if API is available)
    try {
        // Check if API_URL is a valid absolute URL
        if (!API_URL.startsWith('http')) {
            console.warn(`⚠️ Skipped dynamic sitemap generation: API_URL '${API_URL}' is not an absolute URL (required for Node.js).`);
            console.warn('   Using static routes only.');
        } else {
            const response = await axios.get(`${API_URL}/client/products?type=ALL`, { timeout: 5000 });

            if (response.data.success) {
                const allProducts = response.data.products || [];
                productsToMap = allProducts.filter(p => p.type === 'PROFILE' || p.type === 'OFFER');
                console.log(`✅ Fetched ${productsToMap.length} products for sitemap.`);
            } else {
                console.warn('⚠️ API returned success:false. Using static routes only.');
            }
        }
    } catch (error) {
        console.warn(`⚠️ Could not fetch products for sitemap: ${error.message}`);
        if (error.code === 'ECONNREFUSED') {
            console.warn('   Backend server is likely not running during build. This is expected in some CI/CD environments.');
        } else if (error.code === 'ERR_INVALID_URL') {
            console.warn('   Invalid API URL provided.');
        }
        console.warn('   Falling back to static sitemap.');
    }

    // 2. Build XML (Always generate at least the static parts)
    try {
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

        // 3. Add Dynamic Product Routes (if any)
        productsToMap.forEach(product => {
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

    } catch (writeError) {
        console.error('❌ Critical Error writing sitemap file:', writeError.message);
        process.exit(1); // Fail build only if we can't write the file
    }
}

generateSitemap();
