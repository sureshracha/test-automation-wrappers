# test-automation-wrappers 

## Get Started 
 complete wrapper methods and example to use
 
### available wrappers
0. `lib/asserts` -> All environment configurations files
1. `lib/logger` -> supported data for exeucution contains folder ( ref, txn, and common)
2. `lib/playwright` -> contains all the feature files for test execution (authos_copy, cwfm [e2d,letters,smoke,workflows])
3. `lib/testContext` -> all utility functions for ICUE and OCM
4. `utils/date.utils` -> Simple way to share the page objects to steps (common folder has all the login and apps)
5. `uitls/file.utils` -> all the step files 
6. `utils/string.utils` -> One file to do all the configuration for cypress 

### example to use the playwright wrapper using mocha framework


describe('A first sample Playwright test', () => {

    before(async function () {
        playwright.browser = await invokeBrowser('chrome', { headless: true });
        playwright.context = await playwright.browser.newContext();
        playwright.page = await playwright.context.newPage();
        playwright.context.setDefaultTimeout(100000);

        testContext.assertsJson = JSON.parse("{}");
        testContext.assertsJson.soft = [];
        await fileUtils.ensureDir('test-results/log');
        testContext.logger = createLogger(options({ fileName: 'test', logfileFolder: 'test-results/log' }));
        await logger.info('Starting of scenario')

    });

    after(async function () {
        closeplaywright();
    });

    it('Search Playwright documentation from Goggle', async () => {
        let searchBox = new UiElement('[name="q"]', { description: 'Searcg Box' });
        await gotoUrl('https://google.com?hl=en');
        await searchBox.setValue('Playwright doc');
        await customAssert.softAssert('test', 'test1', 'Both should be equal');
        await logger.info('end of scenario');
        console.log(testContext.assertsJson)
        return true;
    })

});