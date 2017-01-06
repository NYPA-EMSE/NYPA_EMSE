/**************************************************************************************************************
*	Mike Linscheid
*/
try{
	showMessage = true;
	cancel = true;
	comment("Manual invoice creation is not permited.")
}
catch (err) {
	logDebug("A JavaScript Error occurred: ASB:CANALS/Occupancy/Invoice/NA: " + err.message);
	logDebug(err.stack)
}
