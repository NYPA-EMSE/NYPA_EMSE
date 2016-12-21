var sysFromEmail = lookup("ACA_EMAIL_TO_AND_FROM_SETTING", "RENEW_LICENSE_AUTO_ISSUANCE_MAILFROM");
/**************************************************************************************************************
*	ID-2 - Send Email Active
*	Mike Linscheid
*/
try{
	if (capStatus == "Active") {
		var emailTemplateName = "CANAL_ACTIVE"
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
		FemailList = getUserEmailsByTitle("Finance")

		for (e in DLMemailList) sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null)
		for (e in PAemailList) sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null)
		for (e in FemailList) sendNotification(sysFromEmail, FemailList[e], "", emailTemplateName, eParams, null)

		//Send to WORKFLOW People
		sendNotification(sysFromEmail, getTaskCompletersEmail("Application Entry",getParent()), "", emailTemplateName, eParams, null)
		sendNotification(sysFromEmail, getTaskCompletersEmail("DPE Review",getParent()), "", emailTemplateName, eParams, null)
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: ASUA:CANALS/Occupancy/Permit/NA: #02: " + err.message);
	logDebug(err.stack)
}

/**************************************************************************************************************
*	ID-3 - Send Email Canceled
*	Mike Linscheid
*/
try{
	if (capStatus == "Canceled") {
		var emailTemplateName = "CANAL_STATUS_CHANGE"
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
		addParameter(eParams, "$$status$$", capStatus)
		addParameter(eParams, "$$userId$$", currentUserID)

		DLMemailList = getUserEmailsByTitle("Director of Land Management")
		PAemailList = getUserEmailsByTitle("Permit Administrator")
		FemailList = getUserEmailsByTitle("Finance")

		for (e in DLMemailList) sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null)
		for (e in PAemailList) sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null)
		for (e in FemailList) sendNotification(sysFromEmail, FemailList[e], "", emailTemplateName, eParams, null)

		//Send to WORKFLOW People
		sendNotification(sysFromEmail, getTaskCompletersEmail("Application Entry",getParent()), "", emailTemplateName, eParams, null)
		sendNotification(sysFromEmail, getTaskCompletersEmail("DPE Review",getParent()), "", emailTemplateName, eParams, null)
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: ASUA:CANALS/Occupancy/Permit/NA: #03: " + err.message);
	logDebug(err.stack)
}
