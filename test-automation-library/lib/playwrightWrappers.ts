
import { Page, APIRequestContext, BrowserContext, Browser, chromium, firefox, webkit } from "@playwright/test";
import logger from "./logger";
import { cssPath } from "playwright-dompath";

abstract class UiActions {

    protected locator: string;
    protected page: Page;
    protected objectDescriptor: string;
    protected isPopupExist: boolean;
    protected pageIndex: number;
    protected fullCss: string;
    //description: string = "Object - ", isPopup: boolean = false, pageIndex: number = 0
    constructor(locator: string, options?: { description?: string, isPopup?: boolean, pageIndex?: number }) {
        this.locator = locator;
        this.isPopupExist = options?.isPopup !== undefined ? options?.isPopup : false;
        this.pageIndex = options?.pageIndex !== undefined ? options?.pageIndex : 0;
        this.objectDescriptor = options?.description !== undefined ? options?.description : 'Object - ';
        this.fullCss = '';
    }

    protected async getPage() {
        if (this.isPopupExist === true) {
            if (playwrightWrappers.popup === undefined) {
                this.page = playwrightWrappers.popup;
                const [newPopup] = await Promise.all([
                    playwrightWrappers.page.waitForEvent('popup'),
                    playwrightWrappers.page.waitForTimeout(1000)
                ]);
                playwrightWrappers.popup = newPopup;
                this.page = playwrightWrappers.popup;
            }
            this.page = playwrightWrappers.popup;
        } else {
            const pages = playwrightWrappers.context.pages()
            this.page = pages[this.pageIndex];
        }

    }

    async switchPage(pageIndex: number) {
        this.pageIndex = pageIndex;
        return this;
    }

    async clickToOpenPopup(options?: { forceClick?: boolean }) {
        let _forceClick = options?.forceClick.valueOf() !== undefined ? options?.forceClick : false;
        const [newPopup] = await Promise.all([
            playwrightWrappers.page.waitForEvent('popup'),
            playwrightWrappers.page.locator(await this.getLocator()).click({ force: _forceClick }),
            console.log(`Clicked on ${this.objectDescriptor}`),
            playwrightWrappers.page.waitForTimeout(1000)
        ]);
        playwrightWrappers.popup = newPopup;
    }

    async clickLink(linkName: string, options?: { linkNameExactMatch?: boolean, forceClick?: boolean }) {
        let _linkNameExactMatch = options?.linkNameExactMatch.valueOf() !== undefined ? options?.linkNameExactMatch : true;
        let _forceClick = options?.forceClick.valueOf() !== undefined ? options?.forceClick : false;
        await this.waitTillElementToBeReady().then(async () => {
            if (linkName) {
                await this.page.getByRole('link', {
                    name: `${linkName} `, exact: _linkNameExactMatch
                }).waitFor()
                await this.page.getByRole('link', {
                    name: `${linkName} `, exact: _linkNameExactMatch
                }).click({ force: _forceClick });
                await this.clearFullCss();

                await logger.info(`clicked on the Link with name - ${linkName} with excat match - ${_linkNameExactMatch} on ${this.objectDescriptor} `);
            }
        })

    }

    async clickLastLink(options?: { forceClick?: boolean }) {
        let _forceClick = options?.forceClick.valueOf() !== undefined ? options?.forceClick : false;
        await this.waitTillElementToBeReady().then(async () => {
            await logger.info(`clicked on the last link  - ${this.objectDescriptor}`);
            await this.page.locator(await this.getLocator()).last().click({ force: _forceClick });
            await this.clearFullCss();
        })
    }

    async clickFirstLink(options?: { forceClick?: boolean }) {
        let _forceClick = options?.forceClick.valueOf() !== undefined ? options?.forceClick : false;
        await this.waitTillElementToBeReady().then(async () => {
            await logger.info(`clicked on the first link  - ${this.objectDescriptor}`);
            await this.page.locator(await this.getLocator()).first().click({ force: _forceClick });
            await this.clearFullCss();
        })

    }

    async getSibling(locator: string, nthElement = 0) {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = await this.page.locator(await this.getLocator()).locator('xpath=..').locator(locator).nth(nthElement);
            this.fullCss = await (await cssPath(ele)).toString();
            return this;
        })
    }

    async getParent() {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = this.page.locator(await this.getLocator()).locator('..');
            this.fullCss = await (await cssPath(ele)).toString();
            return this;
        })
    }

    async getNth(index: number) {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = await this.page.locator(await this.getLocator()).nth(index);
            this.fullCss = await (await cssPath(ele)).toString();
            return this;
        })
    }

    async getCount() {
        return await this.waitTillElementToBeReady().then(async () => {
            let length = Number(await this.page.locator(await this.getLocator()).count());
            await this.clearFullCss();
            return length;
        })

    }

    async getPageObject(index: number) {
        return await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).nth(index).focus()
            return await this.page.locator(await this.getLocator()).nth(index);
        })
    }

    async getObject(index: number) {
        return await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).nth(index).focus()
            let ele = await this.page.locator(await this.getLocator()).nth(index);
            this.fullCss = await (await cssPath(ele)).toString();
            return this;
        })
    }

    async getPropertyValue(property: string) {
        return await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).focus()
            let prpVal = (await this.page.locator(await this.getLocator()).getAttribute(property));
            await this.clearFullCss();
            return prpVal === null ? '' : prpVal;
        })
    }

    async contains(containsText: string) {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = await this.page.locator(await this.getLocator()).filter({ hasText: `${containsText}` });
            this.fullCss = (await cssPath(ele)).toString();
            return this;
        })
    }

    async hasText(containsText: string, exactMatch = false) {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = await this.page.locator(await this.getLocator()).getByText(`${containsText}`, { exact: exactMatch });
            this.fullCss = (await cssPath(ele)).toString();
            return this;
        })
    }

    protected async clearFullCss() {
        this.fullCss = ''.toString();
        return this;
    }

    async containsClick(containsText: string, options?: { forceClick?: boolean }) {
        let _forceClick = options?.forceClick.valueOf() !== undefined ? options?.forceClick : false;
        await this.waitTillElementToBeReady().then(async () => {
            console.log('in contains force click ....')
            await this.page.locator(await this.getLocator()).filter({ hasText: `${containsText} ` }).click({ force: _forceClick })
            await explicitWait(100);
            await logger.info(`  clicked on the ${this.objectDescriptor} constains the text [${containsText}]`);
            await this.clearFullCss();
        })
    }

    async forceClick() {
        await this.waitTillElementToBeReady().then(async () => {
            await logger.info(`clicked with force on ${this.objectDescriptor}`);
            await this.page.locator(await this.getLocator()).click({ force: true });
            await this.clearFullCss();
        })
    }

    async waitTillElementToBeReady() {
        await this.isExist().then(async (exist) => {
            if (!exist) await logger.error(`${this.objectDescriptor} - is not exist in the DOM`);
        })
    }

    async getText(index = null) {
        return await this.waitTillElementToBeReady().then(async () => {
            await logger.info(`getting text from ${this.objectDescriptor}`);
            if (index === null) {
                let text = await (await this.page.locator(await this.getLocator()).innerText()).toString();
                await this.clearFullCss();
                return text;
            }
            let text = await (await this.page.locator(await this.getLocator()).nth(index).innerText()).toString();
            await this.clearFullCss();
            return text;
        })
    }

    async getCurrentObject() {
        return this;
    }

    async getPageTitle() {
        return await this.waitTillElementToBeReady().then(async () => {
            let title = await (await this.page.title()).toString();
            await this.clearFullCss();
            return title;
        })
    }

    async isExist() {
        return await this.getPage().then(async () => {
            await this.page.waitForTimeout(10);
            return await this.page.waitForLoadState().then(async () => {
                return await this.page.waitForLoadState('domcontentloaded').then(async () => {
                    return await this.page.waitForLoadState('networkidle').then(async () => {
                        return await this.page.waitForLoadState().then(async () => {
                            return await this.waitForDomComplete(this.page).then(async () => {
                                return await this.page.$(await this.getLocator()) == null ? false : true;
                            })
                        })
                    })
                })
            })
        })
    }

    async isEnabled() {
        return await this.waitTillElementToBeReady().then(async () => {
            let enabled = await this.page.locator(await this.getLocator()).isEnabled();
            await this.clearFullCss();
            return enabled;
        })
    }

    async isVisible() {
        return await this.waitTillElementToBeReady().then(async () => {
            let visible = await this.page.locator(await this.getLocator()).isVisible()
            await this.clearFullCss();
            return visible;
        })
    }

    async scrollIntoView(options: string = 'End') {
        await this.waitTillElementToBeReady().then(async () => {
            await this.page.keyboard.down(options);
            await this.waitTillElementToBeReady().then(async () => { })
        })
    }

    async getCss(cssValue: string) {
        return await this.waitTillElementToBeReady().then(async () => {
            let cssVal = await this.page.locator(await this.getLocator()).evaluate(
                element => window.getComputedStyle(element).getPropertyPriority(cssValue)
            )
            await this.clearFullCss();
            return cssVal;
        })
    }

    protected async getLocator() {
        return this.fullCss === '' ? this.locator : this.fullCss;
    }

    async find(locator: string) {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = await this.page.locator(await this.getLocator()).locator(locator);
            this.fullCss = (await cssPath(ele)).toString();
            return this;
        })
    }

    async setDescription(desc: string) {
        this.objectDescriptor = desc;
        return this;
    }

    async getTextAllMatchingObjects() {
        return await this.waitTillElementToBeReady().then(async () => {
            let arr = [];
            let count = await this.page.locator(await this.getLocator()).count();
            for (let indx = 0; indx < count; indx++) {
                await explicitWait(100);
                let iText = await this.page.locator(await this.getLocator()).nth(indx).innerText()
                arr.push(iText.trim())
            }
            await this.clearFullCss();
            return arr;
        })
    }

    async clear() {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = await this.page.locator(await this.getLocator());
            this.fullCss = (await cssPath(ele)).toString();
            ele.clear();
            return this;
        })
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


    async click(options?: { objIndex?: number, forceClick?: boolean }) {
        let _objIndex = options?.objIndex.valueOf() !== undefined ? -1 : options?.objIndex;
        let _forceClick = options?.forceClick.valueOf() !== undefined ? options?.forceClick : false;
        await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).focus()
            const obj = _objIndex > 0 - 1 ? await this.page.locator(await this.getLocator()).nth(_objIndex) : await this.page.locator(await this.getLocator()).first();
            await obj.click({ force: _forceClick });
            await logger.info(`clicked on the ${this.objectDescriptor} of ${_objIndex > 0 ? _objIndex : 'first'}`);
            await this.waitTillElementToBeReady();
            await this.clearFullCss();
        })
    }

    async dblClick(options?: { objIndex?: number, forceClick?: boolean }) {
        let _objIndex = options?.objIndex.valueOf() !== undefined ? -1 : options?.objIndex;
        let _forceClick = options?.forceClick.valueOf() !== undefined ? options?.forceClick : false;
        await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).focus()
            const obj = _objIndex > -1 ? await this.page.locator(await this.getLocator()).nth(_objIndex) : await this.page.locator(await this.getLocator()).first();
            await obj.dblclick({ force: _forceClick });
            await logger.info(`dbl clicked on the ${this.objectDescriptor} of ${_objIndex > 0 ? _objIndex : 'first'}`);
            await this.waitTillElementToBeReady();
            await this.clearFullCss();
        })
    }

    async chooseFiles(files: string[]) {
        await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).setInputFiles(files)
            await this.waitTillElementToBeReady();
            await this.clearFullCss();
        })
    }

    async check(options?: { objIndex?: number, forceClick?: boolean }) {
        let _objIndex = options?.objIndex.valueOf() !== undefined ? -1 : options?.objIndex;
        let _forceClick = options?.forceClick.valueOf() !== undefined ? options?.forceClick : false;

        await this.waitTillElementToBeReady().then(async () => {
            const obj = _objIndex > -1 ? await this.page.locator(await this.getLocator()).nth(_objIndex) : await this.page.locator(await this.getLocator()).first();
            let flag = await obj.getAttribute('disabled')
            if (!flag) {
                await obj.check({ force: _forceClick })
                await logger.info(`${this.objectDescriptor} - checked the checkbox`);
            } else {
                await logger.info(`${this.objectDescriptor} - unable to check the checkbox, its disabled`);
            }
            await this.clearFullCss();
        })
    }

    async uncheck(options?: { objIndex?: number, forceClick?: boolean }) {
        let _objIndex = options?.objIndex.valueOf() !== undefined ? -1 : options?.objIndex;
        let _forceClick = options?.forceClick.valueOf() !== undefined ? options?.forceClick : false;

        await this.waitTillElementToBeReady().then(async () => {
            const obj = _objIndex > -1 ? await this.page.locator(await this.getLocator()).nth(_objIndex) : await this.page.locator(await this.getLocator()).first();
            let flag = await obj.getAttribute('disabled')
            if (!flag) {
                await obj.uncheck({ force: _forceClick })
                await logger.info(`${this.objectDescriptor} - unchecked the checkbox`);
            } else {
                await logger.info(`${this.objectDescriptor} - unable to uncheck the checkbox, its disabled`);
            }
            await this.clearFullCss();
        })
    }

    async setValue(inputString: any) {
        await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).clear()
            await this.page.locator(await this.getLocator()).fill(inputString, { force: true })
            await logger.info(`${this.objectDescriptor} - Set the value -  ${this.objectDescriptor.toLowerCase().includes('password') ? '*******' : inputString}`);
            await this.clearFullCss();
            return;
        })
    }

    async type(inputString: any, options?: { delay?: number }) {
        let _delay = options?.delay.valueOf() !== undefined ? 0 : options?.delay;
        await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).type(inputString, { delay: _delay })
            await logger.info(`${this.objectDescriptor} - Type the value -  ${this.objectDescriptor.toLowerCase().includes('password') ? '*******' : inputString}`);
            await this.clearFullCss();
        })

    }

    async selectListOptionByText(option: string) {
        await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).selectOption(option)
            await logger.info(`${this.objectDescriptor} - Selecting the option : ` + option)
        })
        await this.page.locator(await this.getLocator()).selectOption(option)
        await this.clearFullCss();
    }

    async selectListOptionByIndex(indexOf: number) {
        await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).selectOption({ index: indexOf })
            await logger.info(`${this.objectDescriptor} - Selecting the option index : ` + indexOf)
            await this.clearFullCss();
        })
    }

    async getListOptions() {
        return await this.waitTillElementToBeReady().then(async () => {
            let innerTexts = await this.page.locator(await this.getLocator() + ' option').allInnerTexts();
            await this.clearFullCss();
            return innerTexts;
        })
    }
}

export class UiTable extends UiActions {
    constructor(locator: string, options?: { description?: string, isPopup?: boolean, pageIndex?: number }) {
        super(locator, { description: options?.description, isPopup: options?.isPopup, pageIndex: options?.pageIndex });
    }
    async getColumnHasText(cellvalue: string) {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = await this.page.locator(await this.getLocator()).locator('td').filter({ hasText: `${cellvalue} ` });
            this.fullCss = (await cssPath(ele)).toString();
            return this;

        })
    }

    async waitForRowsToLoad() {
        return await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).locator('tr').nth(0).waitFor({ state: "attached", timeout: 60000 })
            return this;
        })
    }

    async getCellData(row: number, col: number) {
        return await this.waitTillElementToBeReady().then(async () => {
            await logger.info(`getting cell data from ${this.objectDescriptor} - Row,Column [${row},${col}]`);
            let val = (await this.page.locator(await this.getLocator()).locator('tr').nth(row).locator('td').nth(col).innerText()).toString();
            await this.clearFullCss();
            return val;

        })
    }

    async getRowData(row: number) {
        return await this.waitTillElementToBeReady().then(async () => {
            let arr = await this.page.locator(await this.getLocator()).locator('tr').nth(row).allInnerTexts();
            await this.clearFullCss();
            return arr;
        })
    }

    async getAllRowsColumnData(column: number) {
        return await this.waitTillElementToBeReady().then(async () => {
            let arr = [];
            let length = await this.page.locator(await this.getLocator()).locator('tr').count();
            for (let index = 0; index < length; index++) {
                arr.push(await this.page.locator(await this.getLocator()).locator('tr').nth(index).locator('td').nth(column).innerText());
            }
            await this.clearFullCss();
            return arr;
        })
    }

    async getHeaderNames() {
        return await this.waitTillElementToBeReady().then(async () => {
            let arr = this.page.locator(await this.getLocator()).locator('th').allInnerTexts();
            await this.clearFullCss();
            return arr;
        })
    }

    async getRow(index: number) {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = (await this.page.locator(await this.getLocator()).locator('tr').nth(index));
            this.fullCss = (await cssPath(ele)).toString();
            return this;
        })
    }

    async getTable(index = 0) {
        return await this.waitTillElementToBeReady().then(async () => {
            let ele = (await await this.page.locator(await this.getLocator()).nth(index));
            this.fullCss = (await cssPath(ele)).toString();
            return this;
        })
    }

    async getHederColumnNumber(colName: string, exactMatch = false) {
        return await this.waitTillElementToBeReady().then(async () => {
            const innerTextArr = await this.page.locator(await this.getLocator()).locator('th').allInnerTexts();
            await this.clearFullCss();
            if (exactMatch) {
                return innerTextArr.findIndex(ele => ele.trim() === colName.trim());
            }
            return innerTextArr.findIndex(ele => ele.trim().toLowerCase() === colName.trim().toLowerCase());
        })
    }

    async getHeaderName(index: number) {
        return await this.waitTillElementToBeReady().then(async () => {
            let text = this.page.locator(await this.getLocator()).locator('th').nth(index).innerText();
            await this.clearFullCss();
            return text;
        })
    }

    async getHeaderColumnLength() {
        return await this.waitTillElementToBeReady().then(async () => {
            let headerCount = Number(this.page.locator(await this.getLocator()).locator('th').count());
            await this.clearFullCss();
            return headerCount;
        })
    }

    async getRowsLength() {
        return await this.waitTillElementToBeReady().then(async () => {
            let length = Number(await this.page.locator(await this.getLocator()).locator('tr').count());
            await this.clearFullCss();
            return length;
        })

    }

    async getColumnLength() {
        return await this.waitTillElementToBeReady().then(async () => {
            let length = Number(await this.page.locator(await this.getLocator()).locator('tr td').count());
            await this.clearFullCss();
            return length;
        })
    }

    async getRowColumn(rowIndex: number, columnIndex: number) {
        return await this.waitTillElementToBeReady().then(async () => {
            let rowColumn = await this.page.locator(await this.getLocator()).locator('tr').nth(rowIndex).locator('td').nth(columnIndex);
            this.fullCss = (await cssPath(rowColumn)).toString();
            return this;
        })
    }

    async getMatchedRowIndex(rowValues: string[], exactMatch: boolean = false) {
        let arr = new Array();
        rowValues.forEach((ele, i) => {
            rowValues[i] = ele.trim().includes(`'`) ? ele.trim().split(`'`)[1] : ele.trim();
        })

        return await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).locator('tr').nth(0).waitFor()
            const rows = await this.page.locator(await this.getLocator()).locator('tr').count();
            for (let index = 0; index < rows; index++) {
                const table_data = await (await this.page.locator(await this.getLocator()).locator('tr').nth(index).allInnerTexts());
                let rowdata = table_data.toString().split('\t').join('').split('\n');
                if (rowdata.length > 1) {
                    arr.push(rowdata);
                }
            }
            let row_index = arr.findIndex((row_text) => {
                for (const col_data of rowValues) {
                    if (exactMatch) {
                        if (row_text.findIndex(ele => ele.trim().toLowerCase() === col_data.toLowerCase().trim()) < 0) return false;
                    }
                    else {
                        if (row_text.findIndex(ele => ele.trim().toLowerCase().includes(col_data.toLowerCase().trim())) < 0) return false;
                    }
                }
                return true;
            });
            await this.clearFullCss();
            if (row_index >= 0) {
                return row_index;
            }
            return -1;
        })
    }

    async getMatchedRowIndices(rowValues: string[], exactMatch: boolean = false) {
        rowValues.forEach((ele, i) => {
            rowValues[i] = ele.trim().includes(`'`) ? ele.trim().split(`'`)[1] : ele.trim();
        })
        let foundIndices = [];
        return await this.waitTillElementToBeReady().then(async () => {
            const nRows = await this.page.locator(await this.getLocator()).count()
            for (let index = 0; index < nRows; index++) {
                await this.page.locator(await this.getLocator()).locator('tr').nth(index).allInnerTexts().then(async (row_text) => {
                    let row_text_arr = row_text.toString().split('\n');

                    for (const col_data of rowValues) {

                        if (exactMatch) {
                            if (row_text_arr.findIndex(ele => ele.trim().toLowerCase() === col_data.toLowerCase().trim()) < 0) return false;
                        }
                        else {
                            if (row_text_arr.findIndex(ele => ele.trim().toLowerCase().includes(col_data.toLowerCase().trim())) < 0) return false;
                        }
                    }
                    return true;
                }).then(flag => {
                    if (flag) {
                        foundIndices.push(index + 1);
                    }
                })
            }
            await this.clearFullCss();
            return foundIndices;
        })
    }

    async getMetaTableMatchedRowIndex(rowValues: string[], exactMatch: boolean = false) {
        let arr = new Array();
        rowValues.forEach((ele, i) => {
            rowValues[i] = ele.trim();
        })
        return await this.waitTillElementToBeReady().then(async () => {
            await this.page.locator(await this.getLocator()).locator('tr').nth(0).waitFor()
            const rows = await this.page.locator(await this.getLocator()).locator('tr').count();
            for (let index = 0; index < rows; index++) {
                const table_data = await (await this.page.locator(await this.getLocator()).locator('tr').nth(index).allInnerTexts());
                let rowdata = table_data.toString().split('\t').join('').split('\n');
                if (rowdata.length > 1) {
                    arr.push(rowdata);
                }

            }
            let row_index = arr.findIndex((row_text) => {
                for (const col_data of rowValues) {
                    if (exactMatch) {
                        if (row_text.findIndex(ele => ele.trim().toLowerCase() === col_data.toLowerCase().trim()) < 0) return false;
                    }
                    else {
                        if (row_text.findIndex(ele => ele.trim().toLowerCase().includes(col_data.toLowerCase().trim())) < 0) return false;
                    }
                }
                return true;
            });
            await this.clearFullCss();
            if (row_index >= 0) {
                return row_index;
            }
            return -1;
        })
    }

    async getMetaTableMatchedRowIndices(rowValues: string[], exactMatch: boolean = false, minColumnSize: number = 1) {
        rowValues.forEach((ele, i) => {
            rowValues[i] = ele.trim().includes(`'`) ? ele.trim().split(`'`)[1] : ele.trim();
        })
        let arr = new Array();
        let foundIndices = new Array();
        return await this.waitTillElementToBeReady().then(async () => {
            let rows = await this.page.locator(await this.getLocator()).locator('tr').all();
            for (let row of rows) {
                let arrTds = new Array();
                let cols = await row.locator('td').all();
                for (let col of cols) {
                    arrTds.push((await col.innerText()).toString().trim());
                }
                if (arrTds.length > minColumnSize)
                    arr.push(arrTds);
            }

            for (let indx = 0; indx < arr.length; indx++) {
                let row_index = arr.findIndex((row_text: any) => {
                    for (const col_data of rowValues) {
                        if (exactMatch) {
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
                    foundIndices.push(row_index + 1);
                }
            }
            return foundIndices;
        })
    }

    async clickMetaTableRowLink(rowIndex: number, linkName: string = '', lnkIndex: number = -1) {
        await this.waitTillElementToBeReady().then(async () => {
            const row = this.page.locator(await this.getLocator()).nth(rowIndex).locator('tr').nth(0);
            const link = linkName !== '' ? await row.filter({ hasText: `${linkName}` }) : (lnkIndex > -1 ? await row.locator('a').nth(lnkIndex - 1) : await row.locator('a').first());
            await link.click();
            await this.clearFullCss();
        })
    }

    async clickRowByLinkName(rowIndex: number, linkName: string = '', lnkIndex: number = -1) {
        await this.waitTillElementToBeReady().then(async () => {
            const row = await this.page.locator(await this.getLocator()).locator('tr').nth(rowIndex);
            const link = linkName !== '' ? await row.filter({ hasText: `${linkName}` }) : (lnkIndex > -1 ? await row.locator('a').nth(lnkIndex - 1) : await row.locator('a').first());
            await link.click();
            await this.clearFullCss();
        })
    }

    async isColumnValueExist(colValue: string) {
        return await this.waitTillElementToBeReady().then(async () => {
            let exist = await this.page.locator(await this.getLocator()).locator('td').filter({ hasText: `${colValue} ` }).count() > 0
            await this.clearFullCss();
            return exist;

        })
    }

    async clickRowLink(rowIndex: number, options?: { linkIndex?: number, forceclick?: boolean }) {
        let _lIndex = options?.linkIndex?.valueOf() !== undefined ? options?.linkIndex?.valueOf() : 0;
        let _forceclick = options?.forceclick?.valueOf() !== undefined ? options?.forceclick?.valueOf() : false;
        await this.waitTillElementToBeReady().then(async () => {
            const row = await this.page.locator(await this.getLocator() + ' tr').nth(rowIndex);
            await row.locator('a').nth(_lIndex - 1).click({ force: _forceclick });
            await this.clearFullCss();
        })
    }

    async metaTableClickRowLink(rowIndex: number, lnkIndex: number = 0) {
        await this.waitTillElementToBeReady().then(async () => {
            const row = await this.page.locator(await this.getLocator()).nth(rowIndex).locator(' tr').nth(0);
            await row.getByRole('link').nth(lnkIndex - 1).click();
            await this.clearFullCss();
        })
    }

}

export const playwrightWrappers = {
    // @ts-ignore
    page: undefined as Page,
    apiContext: undefined as APIRequestContext,
    popup: undefined as Page,
    newPage: undefined as Page,
    context: undefined as BrowserContext,
    browser: undefined as Browser
}

export const invokeBrowser = async (browserType: string, options?: { headless?: boolean, channel?: string }) => {
    console.log('in invoke browser : ' + browserType)
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
    await playwrightWrappers.page.waitForLoadState('domcontentloaded');
    await playwrightWrappers.page.waitForLoadState('networkidle');
    await playwrightWrappers.page.waitForLoadState();
    return true;
}

export async function waitforPopupLoad() {
    await playwrightWrappers.popup.waitForLoadState('domcontentloaded');
    await playwrightWrappers.popup.waitForLoadState('networkidle');
    await playwrightWrappers.popup.waitForLoadState();
    return true;
}

export async function waitForUrl(url: string) {
    await this.waitForPageLoad();
    await logger.info(' Waiting for the URL : ' + url)
    await playwrightWrappers.page.waitForURL(url, { timeout: 120000, waitUntil: 'domcontentloaded' })
}

export async function explicitWait(timeOut: number,) {
    if (playwrightWrappers.popup !== undefined) {
        await playwrightWrappers.popup.waitForTimeout(timeOut);
    } else
        await playwrightWrappers.page.waitForTimeout(timeOut);

}

export async function gotoUrl(url: string) {
    await playwrightWrappers.page.goto(url, { timeout: 500000, waitUntil: 'networkidle' });
    await logger.info('Launching URL : ' + url)
}

export async function closeplaywrightWrappers() {
    if (playwrightWrappers.popup !== undefined) {
        await playwrightWrappers.popup.close();
    }
    if (playwrightWrappers.page) {
        await playwrightWrappers.page.close();
    }
    await playwrightWrappers.browser.close();
}

export async function getUrl(pageIndex: number = 0) {
    const pages = playwrightWrappers.context.pages()
    const page = pages[pageIndex];
    await page.waitForLoadState();
    return page.url().toString();
}

export async function pause() {
    await playwrightWrappers.page.pause();

}

