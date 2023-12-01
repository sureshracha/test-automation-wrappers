
import { UiElement, playwrightWrappers, invokeBrowser, gotoUrl, closeplaywrightWrappers } from "../test-automation-library/lib/playwrightWrappers";
import { createLogger } from "winston";
import logger, { options } from "../test-automation-library/lib/logger";
import testContext from '../test-automation-library/lib/testContext';
import customAssert from '../test-automation-library/lib/assert';
import * as fileUtils from '../test-automation-library/utils/file.utils'

// Tips :to run only one test  append '.only' after describe
describe('A first sample Playwright test', () => {

    before(async function () {
        playwrightWrappers.browser = await invokeBrowser('chrome', { headless: true });
        playwrightWrappers.context = await playwrightWrappers.browser.newContext();
        playwrightWrappers.page = await playwrightWrappers.context.newPage();
        playwrightWrappers.context.setDefaultTimeout(100000);

        testContext.assertsJson = JSON.parse("{}");
        testContext.assertsJson.soft = [];
        await fileUtils.ensureDir('test-results/log');
        testContext.logger = createLogger(options({ fileName: 'test', logfileFolder: 'test-results/log' }));
        await logger.info('Starting of scenario')

    });

    after(async function () {
        closeplaywrightWrappers();
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