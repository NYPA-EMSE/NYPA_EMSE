
var sysFromEmail = lookup("ACA_EMAIL_TO_AND_FROM_SETTING", "RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
/**************************************************************************************************************
*	ID-8 - Update parent Occupancy Permit upon Amendment completion
*	Mike Linscheid
*/
try{
	if (wfTask == "Issuance" && matches(wfStatus,"Issued","Simple Amendment Closed") ) {
		parentList = getParents("CANALS/Occupancy/Permit/NA")
		
		for (p in parentList) {
			//Create Occupancy Permit
			parentId = parentList[p]
			
			//Copy information from Amendment to parent Permit record
			copyAppSpecific(parentId)
			copyASITables(capId, parentId)
			copyPeopleWithRemove(capId, parentId)
			//aa.cap.copyCapWorkDesInfo(capId, parentId);
			//aa.cap.copyCapDetailInfo(capId, parentId);
			//copyAdditionalInfo(capId, parentId);
		}
		
		//Lock Amendment record
		addStdCondition("ADMIN","Record Lock")
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/Amendment/NA: #08: " + err.message);
	logDebug(err.stack)
}	


/**************************************************************************************************************
*	ID-14 - Send permit revised email
*	Mike Linscheid
*/
try{
	if (wfTask == "DPE Review" && wfStatus == "Complete" ) {
		var emailTemplateName = "CANAL_REVISED"
		applicantName = "-NA-"
		conArr = getContactArray(parentId);
		for (c in conArr) {
			if (conArr[c]["contactType"] == "Applicant" ) {
				applicantName = conArr[c]["firstName"] + " " + conArr[c]["lastName"]
				break
			}
		}
		
		parentCap = aa.cap.getCap(parentId).getOutput();
		
		var eParams = aa.util.newHashtable(); 
		addParameter(eParams, "$$alias$$", parentCap.getCapType().getAlias())
		addParameter(eParams, "$$altId$$",""+parentId.getCustomID())
		addParameter(eParams, "$$applicantName$$", applicantName)
		//addParameter(eParams, "$$status$$", ""+parentCap.getCapStatus())
		//addParameter(eParams, "$$userId$$", currentUserID)
		
		DLMemailList = getUserEmailsByTitle("Director of Land Management")
		PAemailList = getUserEmailsByTitle("Permit Administrator")
		
		for (e in DLMemailList) sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null)
		for (e in PAemailList) sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null)
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/Amendment/NA: #014: " + err.message);
	logDebug(err.stack)
}