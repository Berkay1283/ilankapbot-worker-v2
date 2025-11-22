import { chromium } from 'playwright';

export async function scrapeSahibinden(url) {
  console.log(`Starting scrape for: ${url || 'URL YOK!'}`);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const page = await browser.newPage();

    // Daha gerçekçi kullanıcı
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    await page.setViewportSize({ width: 1366, height: 768 });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

    // 3 saniye ekstra bekle, lazy-load resimlerin gelmesi için
    await page.waitForTimeout(3000);

    // KESİN ÇALIŞAN YÖNTEM – direkt ilan linklerinden çekiyoruz
    const ads = await page.evaluate(() => {
      const results = [];

      // Bütün ilan linklerini tara
      document.querySelectorAll('a[href*="/ilan/"]').forEach(a => {
        const href = a.getAttribute('href');

        // Sadece gerçek ilan linkleri (magaza, galeri, vs. değil)
        if (!href || !href.includes('/ilan/') || href.includes('magaza') || href.includes('galeri') || href.includes('vitrin')) return;

        // ilan ID'sini çıkar
        const match = href.match(/\/([0-9]+)$/);
        if (!match) return;
        const id = match[1];

        // Aynı ilanı birden ekleme
        if (results.some(x => x.id === id)) return;

        const row = a.closest('tr') || a.closest('li') || a.closest('div');
        if (!row) return;

        const title = a.querySelector('.classifiedTitle')?.innerText.trim() ||
                      a.innerText.trim() || 'Başlıksız';

        const price = row.querySelector('.searchResultsPriceValue')?.innerText.trim() ||
                      row.querySelector('[class*="price"]')?.innerText.trim() || 'Fiyat belirtilmemiş';

        const imgEl = row.querySelector('img');
        const image = imgEl?.src ||
                      imgEl?.dataset?.src ||
                      imgEl?.dataset?.lazy ||
                      imgEl?.getAttribute('data-src') || null;

        results.push({
          id,
          title,
          price,
          link: 'https://www.sahibinden.com' + href,
          image
        });
      });

      return results.slice(0, 25); // ilk 25 ilan yeter
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
