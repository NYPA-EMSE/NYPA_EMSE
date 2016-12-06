/**************************************************************************************************************
*	ID-11 - Default Work Permit Expiration date
*	Mike Linscheid
*/
try{
	newExpDate = new Date()
	newExpDate.setMonth(newExpDate.getMonth() +12)
	editAppSpecific("Expiration Date", jsDateToASIDate(newExpDate))
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Work/Permit/NA: #11: " + err.message);
	logDebug(err.stack)
}		