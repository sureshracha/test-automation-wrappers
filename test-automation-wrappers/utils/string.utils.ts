export async function convertAnyToString(val: any) {
    return val.toString();
}

export async function replaceAll(val: string, replaceChar: string) {
    if (val.constructor === String) {
        if (val.includes(replaceChar)) {
            return val.split(replaceChar).join('').toString();
        }
    }
    return val;
}
