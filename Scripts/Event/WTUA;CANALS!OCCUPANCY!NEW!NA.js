
var sysFromEmail = lookup("ACA_EMAIL_TO_AND_FROM_SETTING", "RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
/**************************************************************************************************************
*	ID-1 - Send Email Review & Approval
*	Mike Linscheid
*/
try{
	if (wfTask == "DPE Review" && wfStatus == "Complete" ) {
		var emailTemplateName = "CANAL_REVIEW_AND_APPROVAL"
		applicantName = "-NA-"
		conArr = getContactArray();
		for (c in conArr) {
			if (conArr[c]["contactType"] == "Applicant" ) {
				if (""+conArr[c]["businessName"] != "null") {
					applicantName = ""+conArr[c]["businessName"]
					break
				}
				else {
					applicantName = conArr[c]["firstName"] + " " + conArr[c]["lastName"]
					break
				}
			}
		}

		var eParams = aa.util.newHashtable();
		addParameter(eParams, "$$alias$$", cap.getCapType().getAlias())
		addParameter(eParams, "$$altId$$",capIDString)
		addParameter(eParams, "$$applicantName$$", applicantName)
		//addParameter(eParams, "$$status$$", capStatus)
		//addParameter(eParams, "$$userId$$", currentUserID)

		DLMemailList = getUserEmailsByTitle("Director of Land Management")
		PAemailList = getUserEmailsByTitle("Permit Administrator")

		//logDebug(DLMemailList.join(",") + " | " +PAemailList.join(","))

		for (e in DLMemailList) sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null)
		for (e in PAemailList) sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null)
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/New/NA: #01: " + err.message);
	logDebug(err.stack)
}

/**************************************************************************************************************
*	ID-4 - Send Email Approved
*	Mike Linscheid
*/
try{
	if (wfTask == "HQ Review" && wfStatus == "Approved") {
		var emailTemplateName = "CANAL_APPROVED"
		applicantName = "-NA-"
		conArr = getContactArray();
		for (c in conArr) {
			if (conArr[c]["contactType"] == "Applicant" ) {
				if (""+conArr[c]["businessName"] != "null") {
					applicantName = ""+conArr[c]["businessName"]
					break
				}
				else {
					applicantName = conArr[c]["firstName"] + " " + conArr[c]["lastName"]
					break
				}
			}
		}

		var eParams = aa.util.newHashtable();
		addParameter(eParams, "$$alias$$", cap.getCapType().getAlias())
		addParameter(eParams, "$$altId$$",capIDString)
		addParameter(eParams, "$$applicantName$$", applicantName)
		//addParameter(eParams, "$$status$$", capStatus)
		addParameter(eParams, "$$userId$$", currentUserID)

		DLMemailList = getUserEmailsByTitle("Director of Land Management")
		PAemailList = getUserEmailsByTitle("Permit Administrator")

		for (e in DLMemailList) sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null)
		for (e in PAemailList) sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null)

		//Send to WORKFLOW People
		sendNotification(sysFromEmail, getTaskCompletersEmail("Application Entry"), "", emailTemplateName, eParams, null)
		sendNotification(sysFromEmail, getTaskCompletersEmail("DPE Review"), "", emailTemplateName, eParams, null)
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/New/NA: #04: " + err.message);
	logDebug(err.stack)
}

/**************************************************************************************************************
*	ID-2 - Send Email Active
*	Mike Linscheid
*/
try{
	if (wfTask == "Issuance" && wfStatus == "Issued" ) {
		var emailTemplateName = "CANAL_ACTIVE"

		//Create Occupancy Permit
		parentId = createParent("CANALS","Occupancy","Permit","NA", capName)
		/* //Update Permit ID to match New Record's ID*/

		newAltId = capIDString.slice(0, capIDString.indexOf("-A"))

		updateResult = aa.cap.updateCapAltID(parentId, newAltId)
		if (!updateResult.getSuccess()) {
			logDebug("***WARNING the altId was NOT updated to: " + newAltId)
			newAltId = ""+parentId.getCustomID()
		}
		else {
			logDebug("Successfully changed the altId from: " + capIDString + " to: " + newAltId)
		}


		//Copy information from New to Permit record
		copyAppSpecific(parentId)
		copyASITables(capId, parentId)
		aa.cap.copyCapWorkDesInfo(capId, parentId);
		aa.cap.copyCapDetailInfo(capId, parentId);
		copyAdditionalInfo(capId, parentId);

		applicantName = "-NA-"
		conArr = getContactArray(parentId);
		for (c in conArr) {
			if (conArr[c]["contactType"] == "Applicant" ) {
				if (""+conArr[c]["businessName"] != "null") {
					applicantName = ""+conArr[c]["businessName"]
					break
				}
				else {
					applicantName = conArr[c]["firstName"] + " " + conArr[c]["lastName"]
					break
				}
			}
		}

		parentCap = aa.cap.getCap(parentId).getOutput();

		var eParams = aa.util.newHashtable();
		addParameter(eParams, "$$alias$$", parentCap.getCapType().getAlias())
		addParameter(eParams, "$$altId$$",newAltId)
		addParameter(eParams, "$$applicantName$$", applicantName)
		addParameter(eParams, "$$status$$", ""+parentCap.getCapStatus())
		addParameter(eParams, "$$userId$$", currentUserID)

		DLMemailList = getUserEmailsByTitle("Director of Land Management")
		PAemailList = getUserEmailsByTitle("Permit Administrator")
		FemailList = getUserEmailsByTitle("Finance")

		for (e in DLMemailList) sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null)
		for (e in PAemailList) sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null)
		for (e in FemailList) sendNotification(sysFromEmail, FemailList[e], "", emailTemplateName, eParams, null)

		//Send to WORKFLOW People
		sendNotification(sysFromEmail, ""+getTaskCompletersEmail("Application Entry"), "", emailTemplateName, eParams, null)
		sendNotification(sysFromEmail, ""+getTaskCompletersEmail("DPE Review"), "", emailTemplateName, eParams, null)

		//Lock New record
		addStdCondition("ADMIN","Record Lock")
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/New/NA: #02: " + err.message);
	logDebug(err.stack)
}
