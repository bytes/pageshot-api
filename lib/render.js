const puppeteer = require('puppeteer');

module.exports = async (url, newOpts) => {
  const opts = {
    viewport: {
      width: 1200,
      height: 950
    },
    screenshot: {
      width: 1200,
      height: 950
    },
    render: {
      delay: 0,
      scrollToBottom: false,
      screen: false
    },
    navigate: {
      waitUntil: 'networkidle',
      networkIdleTimeout: 1000
    }
  };

  const conf = Object.assign(opts, newOpts);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  page.on('console', (...args) => console.log(...args));

  page.on('error', err => {
    logger.error(`Error event emitted: ${err}`);
    logger.error(err.stack);
    browser.close();
  });

  try {
    await page.setViewport(conf.viewport);

    if (conf.render.screen) {
      await page.emulateMedia('screen');
    }

    await page.goto(url, conf.navigate);

    await page.waitFor(conf.render.delay);

    if (conf.render.scrollToBottom) {
      return await page.evaluate(() => {
        const scrollInterval = 100;
        const scrollStep = Math.floor(window.innerHeight / 2);
        const bottomThreshold = 400;

        function bottomPos() {
          return window.pageYOffset + window.innerHeight;
        }

        return new Promise((resolve, reject) => {
          function scrollDown() {
            window.scrollBy(0, scrollStep);

            if (document.body.scrollHeight - bottomPos() < bottomThreshold) {
              window.scrollTo(0, 0);
              setTimeout(resolve, 500);

              return;
            }

            setTimeout(scrollDown, scrollInterval);
          }

          setTimeout(reject, 30000);
          scrollDown();
        });
      });
    }

    const screenshot = page.screenshot(conf.screenshot);

    return screenshot;
  } catch (err) {
    throw err;
  }
};
