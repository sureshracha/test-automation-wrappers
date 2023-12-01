import { expect } from "@playwright/test";
import testContext from "./testContext";
import logger from './logger'


class CustomAssert {
    async softAssert(actual: any, expected: any, message: string, caseSensitive: boolean = false) {
        if (actual === String() && expected == String()) {
            actual = caseSensitive ? actual.trim() : actual.toLowerCase().trim();
            expected = caseSensitive ? expected.trim() : expected.toLowerCase().trim();
        }
        if (actual === expected) {
            await logger.info(`softAssert :: ${message} {Actual : [${actual}] - Expected [${expected}]}`);
        } else {
            await logger.error(`softAssert :: ${message} {Actual : [${actual}] - Expected [${expected}]}`);

            testContext.assertsJson.soft.push({ softAssert: "Failed", caseSensitive: `${caseSensitive}`, Actual: `${actual}`, Expected: `${expected}`, message: `${message}` })
        }

    }
    async softContains(actual: any, expected: any, message: string, caseSensitive: boolean = false) {
        actual = caseSensitive ? actual.trim() : actual.toLowerCase().trim();
        expected = caseSensitive ? expected.trim() : expected.toLowerCase().trim();

        if (actual.includes(expected)) {
            await logger.info(`softContains :: ${message} {Actual : [${actual}] - Expected [${expected}]}`);
        } else {
            await logger.error(`softContains :: ${message} {Actual : [${actual}] - Expected [${expected}]}`);
            testContext.assertsJson.soft.push({ softContains: "Failed", caseSensitive: `${caseSensitive}`, Actual: `${actual}`, Expected: `${expected}`, message: `${message}` })
        }
    }

    async softNotContains(actual: any, expected: any, message: string, caseSensitive: boolean = false) {
        actual = caseSensitive ? actual.trim() : actual.toLowerCase().trim();
        expected = caseSensitive ? expected.trim() : expected.toLowerCase().trim();

        if (!actual.includes(expected)) {
            await logger.info(`softNotContains :: ${message} {Actual : [${actual}] - Expected [${expected}]}`);
        } else {
            await logger.error(`softNotContains :: ${message} {Actual : [${actual}] - Expected [${expected}]}`);
            testContext.assertsJson.soft.push({ softNotContains: "Failed", caseSensitive: `${caseSensitive}`, Actual: `${actual}`, Expected: `${expected}`, message: `${message}` })
        }
    }

    async softContainsForStringArray(actual: string[], expected: any, message: string, caseSensitive: boolean = false) {
        actual = caseSensitive ? actual : actual.toString().toLowerCase().split(',');
        expected = caseSensitive ? expected.trim() : expected.toLowerCase().trim();

        if (actual.indexOf(expected) >= 0) {
            await logger.info(`softContainsForStringArray :: ${message} {Actual : [${actual}] - Expected [${expected}]}`);
        } else {
            await logger.error(`softContainsForStringArray :: ${message} {Actual : [${actual}] - Expected [${expected}]}`);
            testContext.assertsJson.soft.push({ softContainsForStringArray: "Failed", caseSensitive: `${caseSensitive}`, Actual: `${actual}`, Expected: `${expected}`, message: `${message}` })
        }
    }

    async softContainsOneOfThem(actual: any, expected: string[], message: string, caseSensitive: boolean = false) {
        actual = caseSensitive ? actual.trim() : actual.toLowerCase().trim();
        expected = caseSensitive ? expected : expected.toString().toLowerCase().split(',');;
        let flag = false;
        for (const element of expected) {
            if (actual.includes(element.trim())) flag = true;
        }
        if (flag) {
            await logger.info(`softContainsOneOfThem :: ${message} {Actual : [${actual}] - Expected One of Them [${expected}]}`);

        } else {
            await logger.error(`softContainsOneOfThem :: ${message} {Actual : [${actual}] - Expected One of Them [${expected}]}`);
            testContext.assertsJson.soft.push({ softContainsOneOfThem: "Failed", caseSensitive: `${caseSensitive}`, Actual: `${actual}`, ExpectedOneofThem: `${expected}`, message: `${message}` })

        }

    }

    async hardAssert(actual: any, expected: any, logMsg: string) {
        expect(expected, `hardAssert :: ${logMsg} \n{Actual : [${actual}] - Expected [${expected}]}`).toEqual(actual);
    }
    async hardContains(actual: string, expected: string, message: string) {
        expect(actual, `hardContains :: ${expected} \n{Actual : [${actual}] - Expected [${expected}]}`).toContain(expected);
    }
    async hardNotContains(actual: string, expected: string, message: string) {
        expect(actual, `hardNotContains :: ${expected} \n{Actual : [${actual}] - Expected [${expected}]}`).not.toContain(expected);
    }

}

export default new CustomAssert();
