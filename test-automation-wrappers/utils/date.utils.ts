export function getDates(startDate: Date, stopDate: Date) {
	let dateArray = new Array();
	let currentDate = startDate;
	while (currentDate <= stopDate) {
		let date = new Date(currentDate);
		dateArray.push(date);
		currentDate = addNoOfDays(currentDate, 1);
	}
	return dateArray;
}

export function addNoOfDays(date: Date, days: number) {

	date.setDate(date.getDate() + days);
	return date;
}

export function subtractNoOfDays(date: Date, days: number) {

	date.setDate(date.getDate() - days);
	return date;
}

export function getMMDDYYYYFormat(date: Date) {
	const yyyy = date.getFullYear().toString();
	const mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based         
	const dd = (date.getDate()).toString();
	return (mm[1] ? mm : "0" + mm[0]) + '/' + (dd[1] ? dd : "0" + dd[0]) + '/' + yyyy;
}

export function getMMDDYYYYFormatWithHiphen(date: Date) {
	const yyyy = date.getFullYear().toString();
	const mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based         
	const dd = (date.getDate()).toString();
	return (mm[1] ? mm : "0" + mm[0]) + '-' + (dd[1] ? dd : "0" + dd[0]) + '-' + yyyy;
}