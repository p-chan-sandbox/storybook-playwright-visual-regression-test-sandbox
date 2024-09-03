import { chromium, devices } from 'playwright'
import storybookIndexJson from './storybook-static/index.json'

const parallel = 8

;(async () => {
  const stories = Object.values(storybookIndexJson.entries).filter(
    ({ type }) => type === 'story',
  )

  const browsers = await Promise.all(
    [...new Array(parallel)].map(async () => await chromium.launch()),
  )

  await Promise.all(
    stories.map(async (story, index) => {
      const startTime = performance.now()

      const browser = browsers[index % parallel]

      const chrome = devices['Desktop Chrome']

      const context = await browser.newContext({
        locale: 'ja',
        timezoneId: 'Asia/Tokyo',
        viewport: chrome.viewport,
        userAgent: chrome.userAgent,
      })

      const page = await context.newPage()

      await page.goto(`http://localhost:5000/iframe.html?id=${story.id}`, {
        waitUntil: 'domcontentloaded',
      })

      await page.waitForSelector('#storybook-root')

      await page.screenshot({
        path: `./screenshots/${story.id}.png`,
        fullPage: true,
        animations: 'disabled',
      })

      await context.close()

      const endTime = performance.now()

      console.log(
        `[INFO] Saving screenshot for ${story.id} (${Math.floor(endTime - startTime)}ms)`,
      )
    }),
  )

  await Promise.all(browsers.map(async (browser) => await browser.close()))

  process.exit(0)
})()
