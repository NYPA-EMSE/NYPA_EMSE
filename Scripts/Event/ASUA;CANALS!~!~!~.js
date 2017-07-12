
if (wfStatus == "Void" || wfStatus == "Withdrawn" || wfStatus == "Denied") 
{
	var emailTemplateName = "CANAL_WFCANCELED"
	var eParams = aa.util.newHashtable();
	addParameter(eParams, "$$alias$$", cap.getCapType().getAlias());
	addParameter(eParams, "$$altId$$",capIDString);
	addParameter(eParams, "$$wfStatus$$", capStatus);
	PAemailList = getUserEmailsByTitle("Permit Administrator");
	logDebug(PAemailList.join(","));
	for (e in PAemailList)
	{
		//sendNotification("noreply@nypa.com", PAemailList[e], "", emailTemplateName, eParams, null);
		sendNotification("noreply@nypa.com", "jeffrey.moyer@scubeenterprise.com", "", emailTemplateName, eParams, null);
	}
}