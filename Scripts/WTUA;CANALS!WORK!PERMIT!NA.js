/**************************************************************************************************************
*	ID-1 - Invoice Work Permit Fee and
*	Mike Linscheid
*/
try{
	if (wfTask == "DPE Review" && wfStatus == "Complete" ) {
		if (feeExists("CNL-WP-FEE","NEW")) {
			invoiceFee("CNL-WP-FEE","FINAL")
		}
		else if (!feeExists("CNL-WP-FEE","INVOICED")) {
			updateFee("CNL-WP-FEE","CANAL-WP-N","FINAL",1,"Y")
		}

		editAppSpecific("Fees Locked","CHECKED")
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/New/NA: #01: " + err.message);
	logDebug(err.stack)
}
