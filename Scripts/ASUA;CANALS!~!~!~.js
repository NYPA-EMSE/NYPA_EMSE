
if (capStatus == "Void" || capStatus == "Withdrawn" || capStatus == "Denied") 
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
		sendNotification("noreply@nypa.com", PAemailList[e], "", emailTemplateName, eParams, null);
	}
	var assignEmail = getCreatedByEmail(capId);
	if (!matches(assignEmail, null, "", undefined))
	{
		sendNotification("noreply@nypa.com", assignEmail, "", emailTemplateName, eParams, null);
	}
	var cEmail = getCurrentUserEmail();
	if (!matches(cEmail, null, "", undefined))
	{
		sendNotification("noreply@nypa.com", cEmail, "", emailTemplateName, eParams, null);
	}
}

function getCurrentUserEmail()
{
	var currUserEmail = "";
	sysUser = aa.people.getSysUserByID(currentUserID);
	if (sysUser.getSuccess())
	{
		sysUserObj = sysUser.getOutput();
		currUserEmail = sysUserObj.getEmail();
	}
	return currUserEmail;
}

function getCreatedByEmail() // option CapId
{
	var createdStaff = "";
	var userEmail = "";
	var itemCap = capId
	if (arguments.length > 0)
	{
		itemCap = arguments[0]; // use cap ID specified in args
	}
	var capObjResult = aa.cap.getCap(itemCap);
	if (capObjResult.getSuccess())
	{
		var capDet = capObjResult.getOutput();
		var capMod = capDet.getCapModel();
		createdStaff = capMod.getCreatedBy();
		sysUser = aa.people.getSysUserByID(createdStaff);
		if (sysUser.getSuccess())
		{
			sysUserObj = sysUser.getOutput();
			userEmail = sysUserObj.getEmail();
		}
	}
	else
	{ 
		logDebug("**ERROR: No cap script object : " + capObjResult.getErrorMessage());
		userEmail = "";
	}
	return userEmail;
}