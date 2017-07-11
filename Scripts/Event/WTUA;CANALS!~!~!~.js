
if (wfStatus == "Void" || wfStatus == "Withdrawn" || wfStatus == "Denied") 
{
	var emailTemplateName = "CANAL_WFCANCELED"
	var eParams = aa.util.newHashtable();
	addParameter(eParams, "$$alias$$", cap.getCapType().getAlias());
	addParameter(eParams, "$$altId$$",capIDString);
	addParameter(eParams, "$$applicantName$$", applicantName);
	//addParameter(eParams, "$$status$$", capStatus);
	//addParameter(eParams, "$$userId$$", currentUserID);
	DLMemailList = getUserEmailsByTitle("Director of Land Management");
	PAemailList = getUserEmailsByTitle("Permit Administrator");
	//logDebug(DLMemailList.join(",") + " | " + PAemailList.join(","));
	for (e in DLMemailList)
	{
		sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null);
	}
	for (e in PAemailList)
	{
		sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null);
	}
}