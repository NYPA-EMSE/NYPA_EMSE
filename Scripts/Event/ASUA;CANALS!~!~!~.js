
if (wfStatus == "Void" || wfStatus == "Withdrawn" || wfStatus == "Denied") 
{
	var emailTemplateName = "CANAL_WFCANCELED"
	var eParams = aa.util.newHashtable();
	addParameter(eParams, "$$alias$$", cap.getCapType().getAlias());
	addParameter(eParams, "$$altId$$",capIDString);
	addParameter(eParams, "$$applicantName$$", applicantName);
	addParameter(eParams, "$$wfStatus$$", capStatus);
	//addParameter(eParams, "$$userId$$", currentUserID);
	PAemailList = getUserEmailsByTitle("Permit Administrator");
	logDebug(PAemailList.join(","));
	for (e in PAemailList)
	{
		sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null);
	}
}