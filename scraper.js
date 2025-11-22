import { chromium } from 'playwright';

/**
 * Scrapes the first page of Sahibinden results for a given URL
 * @param {string} url 
 * @returns {Promise<Array<{id: string, title: string, price: string, link: string, image: string}>>}
 */
export async function scrapeSahibinden(url) {
  console.log(`Starting scrape for: ${url || 'URL YOK!'}`);
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();
    
    // Navigate with a timeout
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait specifically for the results list or standard list
    try {
      // 2025 Kasım itibariyle çalışan 3 farklı selector (biri kesin tutar)
await Promise.race([
  page.waitForSelector('table#searchResultsTable tr[data-id]', { timeout: 15000 }),
  page.waitForSelector('tr.searchResultsItem[data-id]', { timeout: 15000 }),
  page.waitForSelector('a.classifiedTitle', { timeout: 15000 })
]).catch(() => console.log('Hiçbir selector bulunamadı, captcha veya yeni layout olabilir'));
    } catch (e) {
      console.log('List selector not found, checking for captcha or empty results...');
      // If we hit a captcha or empty page, we might need to handle it or just return empty
    }

    // Evaluate the page content to extract listings
const ads = await page.$$eval('tr[data-id]', (rows) => {
  return rows.map(row => {
    try {
      const id = row.getAttribute('data-id');
      if (!id) return null;
      const titleEl = row.querySelector('a.classifiedTitle') || row.querySelector('.classifiedTitle');
      const priceEl = row.querySelector('.searchResultsPriceValue');
      const linkEl = row.querySelector('a.classifiedTitle');
      const imgEl = row.querySelector('img');
      const image = imgEl?.src || imgEl?.getAttribute('data-src') || imgEl?.getAttribute('data-lazy') || null;

      return {
        id,
        title: titleEl?.innerText.trim() || 'Başlıksız',
        price: priceEl?.innerText.trim() || 'Fiyat Yok',
        link: linkEl?.href || '',
        image
      };
    } catch {
      return null;
    }
  }).filter(Boolean);
});

    console.log(`Found ${ads.length} ads.`);
    return ads;

  } catch (error) {
    console.error('Scraping error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}
