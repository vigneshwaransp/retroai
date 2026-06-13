const puppeteer = require('puppeteer-core');

async function run() {
  let browser;
  try {
    const isLocal = true;
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log("Opening page...");
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const query = 'cute puppies';
    console.log("Navigating to search page for query:", query);
    try {
      await page.goto(`https://images.search.yahoo.com/search/images?p=${encodeURIComponent(query)}`, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      console.log("Navigation complete.");
    } catch (e) {
      console.warn("Navigation warning:", e.message);
    }

    const title = await page.title();
    console.log("Page Title:", title);

    const bodyHtml = await page.content();
    require('fs').writeFileSync('debug_google.html', bodyHtml);
    console.log("HTML content written to debug_google.html");

    console.log("Waiting for image elements...");
    await page.waitForSelector('img', { timeout: 10000 });

    console.log("Extracting image URLs...");
    const urls = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      // Google images has base64 data URLs or standard HTTP URLs. Let's get the ones that look like real search result thumbnails.
      return Array.from(imgs)
        .map(img => img.src || img.dataset.src || img.dataset.iurl)
        .filter(src => src && (src.startsWith('http') || src.startsWith('data:image/jpeg;base64')))
        .slice(2, 6); // Skip the first 1-2 header/logo images
    });

    console.log("Images found via Chrome Protocol:", urls);
  } catch (err) {
    console.error("Error running Puppeteer:", err);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

run();
