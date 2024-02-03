import { Page, APIRequestContext, BrowserContext, Browser, chromium, firefox, webkit, Locator } from "@playwright/test";
import logger from "./logger";
import { cssPath, xPath } from "playwright-dompath";


abstract class UiActions {

    protected locator: string;
    protected page: Page;
    protected objectDescriptor: string;
    protected isPopupExist: boolean;
    protected pageIndex: number;
    protected fullCss: string;
    protected fullXpath: string;
    protected tempLocator: Locator;
    protected tempLocators: Locator[];
    //description: string = "Object - ", isPopup: boolean = false, pageIndex: number = 0
    constructor(locator: string, options?: { description?: string, isPopup?: boolean, pageIndex?: number }) {

        this.locator = locator;
        this.fullCss = this.locator;
        this.isPopupExist = options?.isPopup?.valueOf() !== undefined ? options?.isPopup?.valueOf() : false;
        this.pageIndex = options?.pageIndex?.valueOf() !== undefined ? options?.pageIndex?.valueOf() : 0;
        this.objectDescriptor = options?.description?.valueOf() !== undefined ? options?.description?.valueOf() : 'Object - ';

    }
    protected async getPage() {
        if (this.isPopupExist === true) {
            if (playwright.popup === undefined) {
                this.page = playwright.popup;
                const [newPopup] = await Promise.all([
                    playwright.page.waitForEvent('popup')
                ]);
                playwright.popup = newPopup;
                this.page = playwright.popup;

            }
            this.page = playwright.popup;
        } else {
            const pages = playwright.context.pages()
            this.page = pages[this.pageIndex];
        }
    }

    async switchPage(pageIndex: number) {
        this.pageIndex = pageIndex;
        return this;
    }

    async setLocator(locator: string, options?: { description?: string }) {
        this.locator = locator;
        if (options?.description?.valueOf() !== undefined) this.objectDescriptor = options?.description;
        return this;
    }
    async clickToOpenPopup(options?: { force?: boolean }) {
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;
        const [newPopup] = await Promise.all([
            playwright.page.waitForEvent('popup'),
            playwright.page.locator(await this.getLocator()).click({ force: _force })
        ]);
        playwright.popup = newPopup;
    }

    protected async getElements(options?: { index?: number }) {
        return await this.waitTillElementToBeReady().then(async () => {
            if (options?.index?.valueOf() === undefined) {
                return await this.page.$$(await this.getLocator());
            }
            let ele = await this.page.$$(await this.getLocator());
            return ele[options?.index];
        })
    }
    protected async getElement() {
        return await this.waitTillElementToBeReady().then(async () => {
            return this.page.locator(await this.getLocator());
        })
    }
    protected async setCssAndXPath(element: Locator) {
        this.fullCss = await (await cssPath(element)).toString();
        this.fullXpath = await (await xPath(element)).toString();
    }

    async clickLink(linkName: string, options?: { linkNameExactMatch?: boolean, force?: boolean }) {
        let _linkNameExactMatch = options?.linkNameExactMatch?.valueOf() !== undefined ? options?.linkNameExactMatch : true;
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;
        await this.waitTillElementToBeReady().then(async () => {
            if (linkName) {
                await this.page.getByRole('link', {
                    name: `${linkName} `, exact: _linkNameExactMatch
                }).waitFor()
                await this.page.getByRole('link', {
                    name: `${linkName} `, exact: _linkNameExactMatch
                }).click({ force: _force });
                await this.clearFullCssAndXPath();

                await logger.info(`clicked on the Link with name - ${linkName} with excat match - ${_linkNameExactMatch} on ${this.objectDescriptor} `);
            }
        })

    }


    async clickLastLink(options?: { force?: boolean }) {
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;
        await logger.info(`clicked on the last link  - ${this.objectDescriptor}`);
        await (await this.getElement()).last().click({ force: _force });
        await this.clearFullCssAndXPath();
    }

    async clickFirstLink(options?: { force?: boolean }) {
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;

        await logger.info(`clicked on the first link  - ${this.objectDescriptor}`);
        await (await this.getElement()).first().click({ force: _force });
        await this.clearFullCssAndXPath();


    }

    async getSibling(locator: string, nthElement = 0) {
        let ele = await (await this.getElement()).locator('xpath=..').locator(locator).nth(nthElement);
        await this.setCssAndXPath(ele);
        return this;
    }

    async getParent() {
        let ele = await (await this.getElement()).locator('..');
        await this.setCssAndXPath(ele);
        return this;
    }

    async getNth(index: number) {
        let ele = await (await this.getElement()).nth(index);
        await this.setCssAndXPath(ele);
        return this;
    }

    async getCount() {
        let length = Number(await (await this.getElement()).count());
        await this.clearFullCssAndXPath();
        return length;
    }

    async getPageObject(index: number) {

        await (await this.getElement()).nth(index).focus()
        return (await this.getElement()).nth(index);

    }

    async getObject(index: number) {

        await (await this.getElement()).nth(index).focus()
        let ele = (await this.getElement()).nth(index);
        await this.setCssAndXPath(ele);
        return this;

    }

    async getPropertyValue(property: string, options?: { index: number }) {
        let _index = options?.index?.valueOf() !== undefined ? options?.index : 0;
        await (await this.getElement()).focus()
        let prpVal = await ((await this.getElement()).nth(_index).getAttribute(property));
        await this.clearFullCssAndXPath();
        return prpVal === null ? '' : prpVal;

    }

    async contains(containsText: string, options?: { index?: number, locator?: string }) {
        let _index = options?.index?.valueOf() !== undefined ? options?.index : 0;
        let ele = await (await this.getElement()).filter({ hasText: `${containsText}` }).nth(_index);
        await this.setCssAndXPath(ele);
        return this;

    }

    async hasText(containsText: string, exactMatch = false, options?: { index?: number }) {
        let _index = options?.index?.valueOf() !== undefined ? options?.index : 0;

        let ele = (await this.getElement()).getByText(`${containsText}`, { exact: exactMatch }).nth(_index);
        await this.setCssAndXPath(ele);
        return this;

    }

    protected async clearFullCssAndXPath() {
        this.fullCss = this.locator.toString();
        this.fullXpath = ''.toString();
        return this;
    }

    async containsClick(containsText: string, options?: { force?: boolean, index?: number }) {
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;
        let _index = options?.index?.valueOf() !== undefined ? options?.index : 0;

        await (await this.getElement()).filter({ hasText: `${containsText}` }).nth(_index).click({ force: _force })
        await explicitWait(100);
        await logger.info(`  clicked on the ${this.objectDescriptor} constains the text [${containsText}]`);
        await this.clearFullCssAndXPath();

    }

    async waitTillElementToBeReady() {
        await this.getPage();
        await this.page.waitForTimeout(10);
        await this.page.waitForLoadState();
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
        await this.waitForDomComplete(this.page);
        // await this.page.waitForSelector(await this.getLocator()); 
    }

    async getText(index = -1) {
        let _index = index === -1 ? 0 : index;
        let text = await (await this.getElement()).nth(_index).innerText();
        await this.clearFullCssAndXPath();
        await logger.info(`getting text from ${this.objectDescriptor}`);
        return text;
    }

    async getCurrentObject() {
        return this;
    }

    async getPageTitle() {
        await this.getPage();
        let title = this.page.title().toString();
        await this.clearFullCssAndXPath();
        return title;
    }

    async isExist() {
        await this.getPage();
        await this.page.waitForTimeout(10);
        await this.page.waitForLoadState();
        await this.page.waitForLoadState('domcontentloaded');
        await this.page.waitForLoadState('networkidle');
        return await this.page.$(await this.getLocator()) == null ? false : true;
    }

    async isEnabled() {
        let enabled = (await this.getElement()).isEnabled();
        await this.clearFullCssAndXPath();
        return enabled;
    }

    async isVisible() {
        let visible = (await this.getElement()).isVisible()
        await this.clearFullCssAndXPath();
        return visible;
    }

    async scrollIntoView(options: string = 'End') {
        await this.page.keyboard.down(options);
    }
    async childHasText(text: string, options?: { exactMatch?: boolean }) {
        await this.waitTillElementToBeReady();
        let _exactMatch = options?.exactMatch?.valueOf() !== undefined ? options?.exactMatch : false;
        if (_exactMatch) {
            let ele = await this.page.locator(await this.getLocator(), { has: this.page.locator(`text="${text}"`).nth(0) }).nth(0);
            await this.setCssAndXPath(ele);
            return this;
        } else {
            let ele = await this.page.locator(`${await this.getLocator()}:has-text("${text}")`).nth(0);
            await this.setCssAndXPath(ele);
            return this;
        }

    }
    async getCss(cssValue: string) {
        return await this.getPage().then(async () => {
            let locatorE = (await this.getElement());
            let jsonVals = await locatorE.evaluate((element: any) => {
                let json = JSON.parse('{}')
                let cssObj = window.getComputedStyle(element)
                for (var i = 0; i < cssObj.length; i++) {
                    json[cssObj[i]] = cssObj.getPropertyValue(cssObj[i]);
                }
                return json;
            })
            await this.clearFullCssAndXPath();
            if (jsonVals[cssValue] !== '') {
                return jsonVals[cssValue];
            }
            else {
                return 'Invalid property';
            }
        })
    }

    protected async getLocator() {
        return this.fullCss === this.locator ? this.locator : this.fullCss;
    }


    async getLocatorFullCss() {
        return this.fullCss;
    }

    async getLocatorFullXpath() {
        return this.fullXpath;
    }

    async find(locator: string, options?: { index?: number, hasText?: string, nthObj?: number }) {
        let _index = options?.index?.valueOf() !== undefined ? options?.index : 0;
        let _objIndex = options?.nthObj?.valueOf() !== undefined ? options?.nthObj : 0;

        if (options?.hasText?.valueOf() === undefined) {
            let ele = await this.page.locator(`${await this.getLocator()} ${locator}`).nth(_index);
            await this.setCssAndXPath(ele);
        } else {
            let ele = await (await this.getElement()).locator(locator, { hasText: `${options.hasText}` }).nth(_index);
            await this.setCssAndXPath(ele);
        }

        if (options?.nthObj?.valueOf() !== undefined) {
            let ele = (await this.getElement()).nth(_objIndex);
            await this.setCssAndXPath(this.tempLocator);
        }
        return this;
    }


    async setDescription(desc: string) {
        this.objectDescriptor = desc;
        return this;
    }

    async getTextAllMatchingObjects() {
        let arr = [];
        let count = await (await this.getElement()).count();
        for (let indx = 0; indx < count; indx++) {
            await explicitWait(100);
            let iText = (await (await this.getElement()).nth(indx).innerText()).toString()
            arr.push(iText.trim())
        }
        await this.clearFullCssAndXPath();
        return arr;
    }

    async clear(option?: { force?: boolean }) {
        let _force = option?.force?.valueOf() === undefined ? false : true;

        let ele = await (await this.getElement());
        await this.setCssAndXPath(ele);
        await ele.clear({ force: _force });
        return this;

    }
    async click(options?: { objIndex?: number, force?: boolean }) {
        let _objIndex = options?.objIndex?.valueOf() === undefined ? 0 : options?.objIndex;
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;
        const obj = await (await this.getElement()).nth(_objIndex);
        await obj.click({ force: _force });
        await logger.info(`clicked on the ${this.objectDescriptor} of [${_objIndex}]`);
        await this.clearFullCssAndXPath();
    }

    async dblClick(options?: { objIndex?: number, force?: boolean }) {
        let _objIndex = options?.objIndex?.valueOf() === undefined ? 0 : options?.objIndex;
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;
        const obj = await (await this.getElement()).nth(_objIndex);
        await obj.dblclick({ force: _force });
        await logger.info(`dbl clicked on the ${this.objectDescriptor} of [${_objIndex}`);
        await this.clearFullCssAndXPath();

    }
    protected async waitForDomComplete(page: Page, pollDelay = 10, stableDelay = 500) {
        let markupPrevious = '';
        const timerStart = new Date();
        let isStable = false;
        let counter = 0;
        while (!isStable) {
            ++counter;
            const markupCurrent = await page.evaluate(() => document.body.innerHTML);
            const elapsed = new Date().getTime() - timerStart.getTime();
            if (markupCurrent == markupPrevious) {
                isStable = stableDelay <= elapsed;
            } else {
                markupPrevious = markupCurrent;
            }
            if (!isStable) {
                await new Promise(resolve => setTimeout(resolve, pollDelay));
            }

        }
    }
}

export class UiElement extends UiActions {
    constructor(locator: string, options?: { description?: string, isPopup?: boolean, pageIndex?: number }) {
        super(locator, { description: options?.description, isPopup: options?.isPopup, pageIndex: options?.pageIndex });
    }


    async getAllObjects(locator: string, options?: { hasText?: string }) {

        if (options?.hasText?.valueOf() === undefined) {
            let arrayLocators = await (await this.getElement()).locator(':scope', { has: this.page.locator(locator) }).all();
            await (await arrayLocators).forEach((loc: Locator) => {
                this.tempLocators.push(loc);
            })

        } else {
            let arrayLocators = await (await this.getElement()).locator(locator, { hasText: `${options.hasText}` }).all();
            await (await arrayLocators).forEach((loc: Locator) => {
                this.tempLocators.push(loc);
            })
        }

        let uiElements: UiElement[];
        this.tempLocators.forEach(async (loc: any, index: number) => {
            let cssLocator = await (await cssPath(loc)).toString();
            let ele = new UiElement(cssLocator, { description: `${this.objectDescriptor} [${index}]` })
            uiElements.push(ele);
        })
        return uiElements;
    }


    async chooseFiles(files: string[]) {
        await this.waitTillElementToBeReady().then(async () => {
            await (await this.getElement()).setInputFiles(files)
            await this.waitTillElementToBeReady();
            await this.clearFullCssAndXPath();
        })
    }

    async check(options?: { objIndex?: number, force?: boolean }) {
        let _objIndex = options?.objIndex?.valueOf() !== undefined ? -1 : options?.objIndex;
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;

        await this.waitTillElementToBeReady().then(async () => {
            const obj = _objIndex > -1 ? await (await this.getElement()).nth(_objIndex) : await (await this.getElement()).first();
            let flag = await obj.getAttribute('disabled')
            if (!flag) {
                await obj.check({ force: _force })
                await logger.info(`${this.objectDescriptor} - checked the checkbox`);
            } else {
                await logger.info(`${this.objectDescriptor} - unable to check the checkbox, its disabled`);
            }
            await this.clearFullCssAndXPath();
        })
    }

    async uncheck(options?: { objIndex?: number, force?: boolean }) {
        let _objIndex = options?.objIndex?.valueOf() !== undefined ? -1 : options?.objIndex;
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;

        const obj = _objIndex > -1 ? await (await this.getElement()).nth(_objIndex) : await (await this.getElement()).first();
        let flag = await obj.getAttribute('disabled')
        if (!flag) {
            await obj.uncheck({ force: _force })
            await logger.info(`${this.objectDescriptor} - unchecked the checkbox`);
        } else {
            await logger.info(`${this.objectDescriptor} - unable to uncheck the checkbox, its disabled`);
        }
        await this.clearFullCssAndXPath();
    }
    /*
       
        Allowed Keys : F1 - F12, Digit0- Digit9, KeyA- KeyZ, Backquote, Minus, Equal, Backslash, Backspace, Tab, Delete, Escape, ArrowDown, End, Enter, Home, Insert, PageDown, PageUp, ArrowRight, ArrowUp, etc.
       
    */
    async setValue(inputString: any, options?: { keyPress?: string, force?: boolean }) {
        let _force = options?.force?.valueOf() !== undefined ? options?.force : false;

        await (await this.getElement()).clear();
        await (await this.getElement()).fill(inputString.toString(), { force: _force })
        if (options?.keyPress?.valueOf() !== undefined) {
            await (await this.getElement()).press(options?.keyPress);
        }
        await logger.info(`${this.objectDescriptor} - Set the value -  ${this.objectDescriptor.toLowerCase().includes('password') ? '*******' : inputString}`);
        await this.clearFullCssAndXPath();

    }
    /*
    
        Allowed Keys : F1 - F12, Digit0- Digit9, KeyA- KeyZ, Backquote, Minus, Equal, Backslash, Backspace, Tab, Delete, Escape, ArrowDown, End, Enter, Home, Insert, PageDown, PageUp, ArrowRight, ArrowUp, etc.
    
    */

    async type(inputString: any, options?: { delay?: number, keyPress?: string }) {
        let _delay = options?.delay?.valueOf() !== undefined ? 0 : options?.delay;

        await (await this.getElement()).type(inputString.toString(), { delay: _delay })
        if (options?.keyPress?.valueOf() !== undefined) {
            await (await this.getElement()).press(options?.keyPress);
        }
        await logger.info(`${this.objectDescriptor} - Type the value -  ${this.objectDescriptor.toLowerCase().includes('password') ? '*******' : inputString}`);
        await this.clearFullCssAndXPath();


    }

    async pressSequentially(inputString: any, options?: { delay?: number, keyPress?: string }) {
        let _delay = options?.delay?.valueOf() !== undefined ? 0 : options?.delay;

        await (await this.getElement()).pressSequentially(inputString, { delay: _delay });

        if (options?.keyPress?.valueOf() !== undefined) {
            await (await this.getElement()).press(options?.keyPress);
        }
        await logger.info(`${this.objectDescriptor} - pressSequentially the value -  ${this.objectDescriptor.toLowerCase().includes('password') ? '*******' : inputString}`);
        await this.clearFullCssAndXPath();


    }

    async selectListOptionByText(option: string) {

        await (await this.getElement()).selectOption(option)
        await logger.info(`${this.objectDescriptor} - Selecting the option : ` + option)
        await this.clearFullCssAndXPath();
    }

    async selectListOptionByIndex(indexOf: number) {

        await (await this.getElement()).selectOption({ index: indexOf })
        await logger.info(`${this.objectDescriptor} - Selecting the option index : ` + indexOf)
        await this.clearFullCssAndXPath();

    }

    async getListOptions() {
        let innerTexts = await this.page.locator(await this.getLocator() + ' option').allInnerTexts();
        await this.clearFullCssAndXPath();
        return innerTexts;
    }
}

export class UiTable extends UiActions {
    constructor(locator: string, options?: { description?: string, isPopup?: boolean, pageIndex?: number }) {
        super(locator, { description: options?.description, isPopup: options?.isPopup, pageIndex: options?.pageIndex });
    }
    async getColumnHasText(cellvalue: string) {
        let ele = await (await this.getElement()).locator('td').filter({ hasText: `${cellvalue} ` });
        await this.setCssAndXPath(ele);
        return this;
    }

    async waitForRowsToLoad(options?: { locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        await this.page.waitForSelector(await this.getLocator() + ` ${_locator}`);
        await (await this.getElement()).locator(_locator).nth(0).waitFor({ state: "attached", timeout: 60000 });
        return this;
    }

    async getCellData(row: number, col: number, options?: { locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        await logger.info(`getting cell data from ${this.objectDescriptor} - Row,Column [${row},${col}]`);
        let val = await (await this.getElement()).locator(_locator).nth(row).locator('td').nth(col).innerText();
        await this.clearFullCssAndXPath();
        await logger.info(`Row,Column [${row},${col}] = ${val}`);
        return val.toString();
    }

    async getRowData(row: number, options?: { locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let arr = await (await this.getElement()).locator(_locator).nth(row).allInnerTexts();
        await this.clearFullCssAndXPath();
        return arr;
    }

    async getAllRowsColumnData(column: number, options?: { locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;

        let arr = [];
        let length = await (await this.getElement()).locator(_locator).count();
        for (let index = 0; index < length; index++) {
            arr.push(await (await this.getElement()).locator(_locator).nth(index).locator('td').nth(column).innerText());
        }
        await this.clearFullCssAndXPath();
        return arr;

    }

    async getHeaderNames() {
        let arr = await (await this.getElement()).locator('th').allInnerTexts();
        await this.clearFullCssAndXPath();
        return arr;
    }


    async getRow(index: number, options?: { locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = await (await this.getElement()).locator(_locator).nth(index);
            await this.setCssAndXPath(ele);
            return this;
        })
    }

    async getTable(index = 0) {

        let ele = await (await this.getElement()).nth(index);
        await this.setCssAndXPath(ele);
        return this;

    }

    async getHederColumnNumber(colName: string, exactMatch = false) {
        const innerTextArr = await (await this.getElement()).locator('th').allInnerTexts();
        await this.clearFullCssAndXPath();
        if (exactMatch) {
            return innerTextArr.findIndex((ele: string) => ele.trim() === colName.trim());
        }
        return innerTextArr.findIndex((ele: string) => ele.trim().toLowerCase() === colName.trim().toLowerCase());
    }

    async getHeaderName(index: number) {
        let text = await (await this.getElement()).locator('th').nth(index).innerText();
        await this.clearFullCssAndXPath();
        return text;
    }

    async getHeaderColumnLength() {
        return await this.waitTillElementToBeReady().then(async () => {
            let headerCount = Number(await (await this.getElement()).locator('th').count());
            await this.clearFullCssAndXPath();
            return headerCount;
        })
    }

    async getRowsLength(options?: { locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let length = await this.isExist() ? Number(await (await this.getElement()).locator(_locator).count()) : 0;
        await this.clearFullCssAndXPath();
        return length;
    }

    async getMetaTableRowsLength(options?: { locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        return await this.waitTillElementToBeReady().then(async () => {
            this.fullCss = await (await this.getLocator()).toString() + ' tr';
            let length = await this.isExist() ? Number(await (await this.getElement()).locator(_locator).count()) : 0;
            await this.clearFullCssAndXPath();
            return length;
        })

    }

    async getColumnLength(rowIndex?: number, options?: { locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let rowI = rowIndex === undefined ? 0 : rowIndex;
        let length = Number(await (await this.getElement()).locator(_locator).nth(rowI).locator('td').count());
        await this.clearFullCssAndXPath();
        return length;
    }

    async getRowColumn(rowIndex: number, columnIndex: number, options?: { locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let rowColumn = await (await this.getElement()).locator(_locator).nth(rowIndex).locator('td').nth(columnIndex);
        await this.setCssAndXPath(rowColumn);
        return this;
    }

    async getMatchedRowIndex(rowValues: string[], options?: { locator?: string, exactMatch?: boolean }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let _exactMatch = options?.exactMatch?.valueOf() === undefined ? false : options?.exactMatch;
        let arr = new Array();
        rowValues.forEach((ele, i) => {
            rowValues[i] = ele.trim().includes(`'`) ? ele.trim().split(`'`)[1] : ele.trim();
        });

        return await this.waitTillElementToBeReady().then(async () => {
            await (await this.getElement()).locator(_locator).nth(0).waitFor();
            const rows = await (await this.getElement()).locator(_locator).count();
            for (let index = 0; index < rows; index++) {
                const table_data = await ((await this.getElement()).locator(_locator).nth(index).allInnerTexts());
                let rowdata = table_data.toString().split('\t').join('').split('\n');
                if (rowdata.length > 1) {
                    arr.push(rowdata);
                }
            }
            let row_index = arr.findIndex((row_text) => {
                for (const col_data of rowValues) {
                    if (_exactMatch) {
                        if (row_text.findIndex((ele: any) => ele.trim().toLowerCase() === col_data.toLowerCase().trim()) < 0) return false;
                    }
                    else {
                        if (row_text.findIndex((ele: any) => ele.trim().toLowerCase().includes(col_data.toLowerCase().trim())) < 0) return false;
                    }
                }
                return true;
            });
            await this.clearFullCssAndXPath();
            if (row_index >= 0) {
                return row_index;
            }
            return -1;
        })
    }

    async getMatchedRowIndices(rowValues: string[], options?: { locator?: string, exactMatch?: boolean }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let _exactMatch = options?.exactMatch?.valueOf() === undefined ? false : options?.exactMatch;
        rowValues.forEach((ele, i) => {
            rowValues[i] = ele.trim().includes(`'`) ? ele.trim().split(`'`)[1] : ele.trim();
        })
        let foundIndices = new Array();

        const nRows = await (await this.getElement()).count()
        for (let index = 0; index < nRows; index++) {
            await (await this.getElement()).locator(_locator).nth(index).allInnerTexts().then(async (row_text) => {
                let row_text_arr = row_text.toString().split('\n');

                for (const col_data of rowValues) {

                    if (_exactMatch) {
                        if (row_text_arr.findIndex(ele => ele.trim().toLowerCase() === col_data.toLowerCase().trim()) < 0) return false;
                    }
                    else {
                        if (row_text_arr.findIndex(ele => ele.trim().toLowerCase().includes(col_data.toLowerCase().trim())) < 0) return false;
                    }
                }
                return true;
            }).then(flag => {
                if (flag) {
                    foundIndices.push(index);
                }
            })
        }
        await this.clearFullCssAndXPath();
        return foundIndices;

    }

    async getMetaTableMatchedRowIndex(rowValues: string[], options?: { locator?: string, exactMatch?: boolean }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let _exactMatch = options?.exactMatch?.valueOf() === undefined ? false : options?.exactMatch;
        let arr = new Array();
        await (await this.getElement()).locator(_locator).nth(0).waitFor()
        rowValues.forEach((ele, i) => {
            rowValues[i] = ele.trim();
        })
        const rows = await (await this.getElement()).locator(_locator).count();
        for (let index = 0; index < rows; index++) {
            const table_data = await ((await this.getElement()).locator(_locator).nth(index).allInnerTexts());
            let rowdata = table_data.toString().split('\t').join('').split('\n');
            if (rowdata.length > 1) {
                arr.push(rowdata);
            }

        }
        let row_index = arr.findIndex((row_text) => {
            for (const col_data of rowValues) {
                if (_exactMatch) {
                    if (row_text.findIndex((ele: any) => ele.trim().toLowerCase() === col_data.toLowerCase().trim()) < 0) return false;
                }
                else {
                    if (row_text.findIndex((ele: any) => ele.trim().toLowerCase().includes(col_data.toLowerCase().trim())) < 0) return false;
                }
            }
            return true;
        });
        await this.clearFullCssAndXPath();
        if (row_index >= 0) {
            return row_index;
        }
        return -1;

    }

    async getMetaTableMatchedRowIndices(rowValues: string[], options?: { locator?: string, exactMatch?: boolean, minColumnSize: number }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let _exactMatch = options?.exactMatch?.valueOf() === undefined ? false : options?.exactMatch;
        let _minColumnSize = options?.minColumnSize?.valueOf() === undefined ? 1 : options?.minColumnSize;
        console.log('Recieved data : ' + rowValues);
        let arr = new Array();
        let foundIndices = new Array();


        let rows = await (await this.getElement()).locator(_locator).all();
        rowValues.forEach((ele, i) => {
            rowValues[i] = ele.trim().includes(`'`) ? ele.trim().split(`'`)[1] : ele.trim();
        })

        console.log(rowValues);
        for (let row of rows) {
            let arrTds = new Array();
            let cols = await row.locator('td').all();
            for (let col of cols) {
                arrTds.push((await col.innerText()).toString().trim());
            }
            if (arrTds.length > _minColumnSize)
                arr.push(arrTds);
        }

        for (let indx = 0; indx < arr.length; indx++) {
            let row_index = arr.findIndex((row_text: any) => {
                for (const col_data of rowValues) {
                    if (_exactMatch) {
                        if (row_text.findIndex((ele: any) => ele.trim().toLowerCase() === col_data.toLowerCase().trim()) < 0) return false;
                    }
                    else {
                        if (row_text.findIndex((ele: any) => ele.trim().toLowerCase().includes(col_data.toLowerCase().trim())) < 0) return false;
                    }
                }
                return true;
            })
            if (row_index >= 0) {
                arr[row_index] = [];
                foundIndices.push(row_index);
            }
        }
        return foundIndices;

    }

    async clickMetaTableRowLink(rowIndex: number, options?: { linkName?: string, lnkIndex?: number, locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let _linkName = options?.linkName?.valueOf() === undefined ? false : options?.linkName;
        let _lnkIndex = options?.lnkIndex?.valueOf() === undefined ? -1 : options?.lnkIndex;

        const row = await (await this.getElement()).nth(rowIndex).locator(_locator).nth(0);
        const link = _linkName !== '' ? row.filter({ hasText: `${_linkName}` }) : (_lnkIndex > -1 ? row.locator('a').nth(_lnkIndex - 1) : row.locator('a').first());
        await link.click();
        await this.clearFullCssAndXPath();
    }

    async clickRowByLinkName(rowIndex: number, options?: { linkName?: string, lnkIndex?: number, locator?: string }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let _linkName = options?.linkName?.valueOf() === undefined ? false : options?.linkName;
        let _lnkIndex = options?.lnkIndex?.valueOf() === undefined ? -1 : options?.lnkIndex;

        const row = await (await this.getElement()).locator(_locator).nth(rowIndex);
        const link = _linkName !== '' ? await row.filter({ hasText: `${_linkName}` }) : (_lnkIndex > -1 ? await row.locator('a').nth(_lnkIndex - 1) : await row.locator('a').first());
        await link.click();
        await this.clearFullCssAndXPath();

    }

    async isColumnValueExist(colValue: string) {
        let exist = await (await this.getElement()).locator('td').filter({ hasText: `${colValue} ` }).count() > 0
        await this.clearFullCssAndXPath();
        return exist;
    }



    async clickRowLink(rowIndex: number, options?: { linkIndex?: number, force?: boolean, locator?: string }) {
        let _lIndex = options?.linkIndex?.valueOf() !== undefined ? options?.linkIndex?.valueOf() : 0;
        let _force = options?.force?.valueOf() !== undefined ? options?.force?.valueOf() : false;
        const row = await this.page.locator(await this.getLocator() + ' tr').nth(rowIndex);
        await row.locator('a').nth(_lIndex).click({ force: _force });
        await this.clearFullCssAndXPath();
    }

    async metaTableClickRowLink(rowIndex: number, options?: { locator?: string, lnkIndex?: number }) {
        let _locator = options?.locator?.valueOf() === undefined ? 'tr' : options?.locator;
        let _lnkIndex = options?.lnkIndex?.valueOf() === undefined ? -1 : options?.lnkIndex;
        const row = await (await this.getElement()).nth(rowIndex).locator(_locator).nth(0);
        await row.getByRole('link').nth(_lnkIndex).click();
        await this.clearFullCssAndXPath();
    }

}

export const playwright = {
    // @ts-ignore
    page: undefined as Page,
    apiContext: undefined as APIRequestContext,
    popup: undefined as Page,
    newPage: undefined as Page,
    context: undefined as BrowserContext,
    browser: undefined as Browser
}

export const invokeBrowser = async (browserType: string, options?: { headless?: boolean, channel?: string }) => {
    console.log('in invoke browser : ' + browserType);
    let _headless = options?.headless?.valueOf() === undefined ? true : options?.headless?.valueOf();
    let _channel = options?.channel?.valueOf() !== undefined ? options?.channel?.valueOf() : '';

    switch (browserType) {
        case "chrome":
            return await chromium.launch({ headless: _headless });
        case "firefox":
            return await firefox.launch({ headless: _headless });
        case "webkit":
            return await webkit.launch({ headless: _headless });
        case "msedge":
            return await chromium.launch({
                channel: 'msedge',
                headless: _headless
            });
        default:
            return await chromium.launch({ headless: _headless });
    }

}

export async function waitForPageLoad() {
    await playwright.page.waitForLoadState('domcontentloaded');
    await playwright.page.waitForLoadState('networkidle');
    await playwright.page.waitForLoadState();
    return true;
}

export async function waitforPopupLoad() {
    await playwright.popup.waitForLoadState('domcontentloaded');
    await playwright.popup.waitForLoadState('networkidle');
    await playwright.popup.waitForLoadState();
    return true;
}

export async function waitForUrl(url: string) {

    await logger.info(' Waiting for the URL : ' + url)
    await playwright.page.waitForURL(url, { timeout: 120000, waitUntil: 'domcontentloaded' })
}

export async function explicitWait(timeOut: number, isPage: boolean = true) {
    if (isPage) {
        await playwright.page.waitForTimeout(timeOut);
    } else
        await playwright.popup.waitForTimeout(timeOut);

}

export async function gotoUrl(url: string) {
    await playwright.page.goto(url, { timeout: 500000, waitUntil: 'networkidle' });
    await logger.info('Launching URL : ' + url)
}

export async function closeplaywright() {
    if (playwright.popup !== undefined) {
        await playwright.popup.close();
    }
    if (playwright.page) {
        await playwright.page.close();
    }
}

export async function getUrl(pageIndex: number = 0) {
    const pages = playwright.context.pages()
    const page = pages[pageIndex];
    await page.waitForLoadState();
    return page.url().toString();
}

export async function pause(options?: { isPage?: boolean }) {
    let _flag = options?.isPage?.valueOf() === undefined ? true : options?.isPage?.valueOf();
    if (_flag) {
        await playwright.page.pause();
    } else {
        await playwright.popup.pause();
    }
}

export async function refreshPage(options?: { isPage?: boolean }) {
    let _flag = options?.isPage?.valueOf() === undefined ? true : options?.isPage?.valueOf();
    if (_flag) {
        await playwright.page.reload();
    } else {
        await playwright.popup.reload();
    }
}
/*
 
F1 - F12, Digit0- Digit9, KeyA- KeyZ, Backquote, Minus, Equal, Backslash, Backspace, Tab, Delete, Escape, ArrowDown, End, Enter, Home, Insert, PageDown, PageUp, ArrowRight, ArrowUp, etc.
 
*/
export async function keyboard(method: string, key: string, options?: { isPage?: boolean, pageIndex?: number }) {
    let _isPage = options?.isPage?.valueOf() === undefined ? true : options?.isPage;
    let _pageIndex = options?.pageIndex?.valueOf() === undefined ? 0 : options?.pageIndex;
    let page: Page;

    if (_isPage !== true) {
        if (playwright.popup === undefined) {

            const [newPopup] = await Promise.all([
                playwright.page.waitForEvent('popup')
            ]);
            playwright.popup = newPopup;;
        }
        page = playwright.popup;
    } else {
        const pages = playwright.context.pages()
        page = pages[_pageIndex];
    }
    await logger.info(`Keybaord method : ${method} - ${key}`);
    switch (method.toLowerCase().trim()) {
        case 'type':
            await page.keyboard.type(key);
            return;
        case 'up':
            await page.keyboard.up(key);
            return;
        case 'down':
            await page.keyboard.down(key);
            return;
        case 'press':
            await page.keyboard.press(key);
            return;
        case 'up':
            await page.keyboard.insertText(key);
            return;
    }

}