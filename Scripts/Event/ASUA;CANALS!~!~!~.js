showDebug = true;

if (capStatus == "Void" || capStatus == "Withdrawn" || capStatus == "Denied") 
{
	getCompletedByEmail(capId);
	/*
	var emailTemplateName = "CANAL_WFCANCELED"
	var eParams = aa.util.newHashtable();
	addParameter(eParams, "$$alias$$", cap.getCapType().getAlias());
	addParameter(eParams, "$$altId$$",capIDString);
	addParameter(eParams, "$$wfStatus$$", capStatus);
	PAemailList = getUserEmailsByTitle("Permit Administrator");
	logDebug(PAemailList.join(","));
	for (e in PAemailList)
	{
		sendNotification("noreply@nypa.com", PAemailList[e], "", emailTemplateName, eParams, null);
	}
	*/
}

function getCompletedByEmail() // option CapId
{
	var compStaff = "";
	var itemCap = capId
	if (arguments.length > 0)
	{
		itemCap = arguments[0]; // use cap ID specified in args
	}
	var capObjResult = aa.cap.getCap(itemCap);
	if (capObjResult.getSuccess())
	{
		var capDet = capObjResult.getOutput();
		debugObject(capDet);
	}
	else
	{ 
		logDebug("**ERROR: No cap script object : " + capObjResult.getErrorMessage());
		return false;
	}
}
 