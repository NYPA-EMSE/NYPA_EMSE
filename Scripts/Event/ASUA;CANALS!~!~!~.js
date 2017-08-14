showDebug = true;

if (capStatus == "Void" || capStatus == "Withdrawn" || capStatus == "Denied") 
{
	getCompletedByDetails(capId);
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

function getCompletedByDetails() // option CapId
{
	var itemCap = capId
	if (arguments.length > 0)
	{
		itemCap = arguments[0]; // use cap ID specified in args
	}
	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (cdScriptObjResult.getSuccess())
	{
		var cdScriptObj = cdScriptObjResult.getOutput();
		if (cdScriptObj)
		{
			cd = cdScriptObj.getCapDetailModel();
			debugObject(cd);
		}
		else
		{
			logDebug("**ERROR: No cap detail script object");
			return false;
		}
	}
	else
	{ 
		logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage());
		return false;
	}
}
 