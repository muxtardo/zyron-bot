/**
 * Get Client Options
 * @param  {Function} start function
 * @param  {Boolean} headless
 */

module.exports = options = (headless, start) => {
    const options = {
        sessionId: 'ZYRON',
        headless: headless,
        qrTimeout: 0,
        authTimeout: 0,
        restartOnCrash: start,
        cacheEnabled: false,
        useChrome: true,
        killProcessOnBrowserClose: true,
        throwErrorOnTosBlock: false,
        hostNotificationLang: 'PT_BR',
        // popup: 3012,
        defaultViewport: null,
        viewport: {
            width: 1280,
            height: 720
        },
        chromiumArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--aggressive-cache-discard',
            '--disable-cache',
            '--disable-application-cache',
            '--disable-offline-load-stale-cache',
            '--disk-cache-size=0'
        ]
    }

    return options;
}
