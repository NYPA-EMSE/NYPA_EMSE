/**************************************************************************************************************
*	ID-1 - Invoice Work Permit Fee and 
*	Mike Linscheid
*/
try{
	if (wfTask == "DPE Review" && wfStatus == "Complete" ) {
		//TODO
		//updateFee("BLD_040","BLD_GENERAL","FINAL",200,"Y","N")
		
		editAppSpecific("Fees Locked","CHECKED")
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/New/NA: #01: " + err.message);
	logDebug(err.stack)
}