/**************************************************************************************************************
*	Mike Linscheid
*/
try{
	addFee("CNL-OC-INV", "CANAL-OC-I", "FINAL", 1, "Y")
}
catch (err) {
	logDebug("A JavaScript Error occurred: ASA:CANALS/Occupancy/Invoice/NA: " + err.message);
	logDebug(err.stack)
}
