/**************************************************************************************************************
*	Mike Linscheid
*/
try{
	addFee("CNL-OC-INV", "CANAL-OC-I", "FINAL", 1, "Y")
	parentId = getParent()
	today = new Date()
	nextInvDate = new Date(today.getTime())
	try {
		nextInvDate = new Date(getAppSpecific("Next Invoice Date", parentId))
	} catch(err){
		//use this month as default
	}

	var addMonths = 12
	switch (""+getAppSpecific("Permit Term", parentId)) {
		case "ANNUAL":
			addMonths = 12;
			break;
		case "SEMI-ANNUAL":
			addMonths = 6;
			break;
		case "QUARTERLY":
			addMonths = 3;
			break;
		case "MONTHLY":
			addMonths = 1;
			break;
	}
	nextInvDate.setMonth(nextInvDate.getMonth() + addMonths)

	editAppSpecific("Last Invoice Date", jsDateToASIDate(today))
	editAppSpecific("Next Invoice Date", jsDateToASIDate(nextInvDate))
}
catch (err) {
	logDebug("A JavaScript Error occurred: ASA:CANALS/Occupancy/Invoice/NA: " + err.message);
	logDebug(err.stack)
}
