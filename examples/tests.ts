
import { UiElement, playwright, invokeBrowser, gotoUrl, closeplaywright } from "../test-automation-wrappers/lib/playwright";
import { createLogger } from "winston";
import logger, { options } from "../test-automation-wrappers/lib/logger";
import testContext from '../test-automation-wrappers/lib/testContext';
import customAssert from '../test-automation-wrappers/lib/assert';
import * as fileUtils from '../test-automation-wrappers/utils/file.utils'

// Tips :to run only one test  append '.only' after describe
describe('A first sample Playwright test', () => {
    before(async function () {
        playwright.browser = await invokeBrowser('chrome', { headless: false });
    })

    beforeEach(async function () {
        playwright.context = await playwright.browser.newContext();
        playwright.page = await playwright.context.newPage();
        playwright.context.setDefaultTimeout(100000);
        testContext.assertsJson = JSON.parse("{}");
        testContext.assertsJson.soft = [];
        await fileUtils.ensureDir('test-results/log');
        testContext.logger = createLogger(options({ fileName: 'test', logfileFolder: 'test-results/log' }));
        await logger.info('Starting of scenario')

    });


    afterEach(async function () {
        closeplaywright();
    });

    after(async function () {
        playwright.browser.close();
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