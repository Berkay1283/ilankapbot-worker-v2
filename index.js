import TelegramBot from 'node-telegram-bot-api';
import { getActiveFilters, isAdSeen, markAdSeen } from './db.js';
import { scrapeSahibinden } from './scraper.js';

// Telegram Config
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '7596193348:AAGIUfSdgt5DW43RfIwCzB3SjIDl2qNtboY';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// Configuration
const CHECK_INTERVAL_MS = 10000; // 10 seconds

async function processFilter(filter) {
  try {
    console.log(`Processing filter ID ${filter.id} for user ${filter.telegram_id}`);
    
    // 1. Scrape ads
    const ads = await scrapeSahibinden(filter.url);

    if (ads.length === 0) {
      console.log('No ads found or scraping failed.');
      return;
    }

    // 2. Process each ad
    // Reverse to process oldest first if multiple new ones appear, so notifications are in order
    for (const ad of ads.reverse()) {
      // Check if already seen
      const seen = await isAdSeen(filter.id, ad.id);
      
      if (!seen) {
        console.log(`New ad found! ID: ${ad.id} - ${ad.title}`);

        // 3. Send Telegram Notification
        const message = `
📢 <b>Yeni İlan Yakalandı!</b>

📦 <b>${ad.title}</b>
💰 Fiyat: ${ad.price}
🔗 <a href="${ad.link}">İlana Git</a>
        `;

        try {
            if (ad.image && !ad.image.includes('base64')) {
                await bot.sendPhoto(filter.telegram_id, ad.image, {
                    caption: message,
                    parse_mode: 'HTML'
                });
            } else {
                await bot.sendMessage(filter.telegram_id, message, {
                    parse_mode: 'HTML',
                    disable_web_page_preview: false
                });
            }
            
            // 4. Mark as seen only after successful send
            await markAdSeen(filter.id, ad.id);
        } catch (tgError) {
            console.error('Telegram send error:', tgError.message);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing filter ${filter.id}:`, error);
  }
}

async function main() {
  console.log('🤖 Sahibinden Bot Started...');
  
  // Infinite loop to keep the process running
  while (true) {
    try {
      const filters = await getActiveFilters();
      console.log(`Active filters count: ${filters.length}`);

      // Process filters sequentially to avoid overloading CPU/Network
      for (const filter of filters) {
        await processFilter(filter);
        // Add a small delay between filters to be polite
        await new Promise(resolve => setTimeout(resolve, 2000)); 
      }

    } catch (error) {
      console.error('Main loop error:', error);
    }

    console.log(`Waiting ${CHECK_INTERVAL_MS}ms...`);
    await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL_MS));
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

// Start the bot
main();
