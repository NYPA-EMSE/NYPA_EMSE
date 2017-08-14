
var assignEmail = "";
if (wfStatus == "Void" || wfStatus == "Withdrawn" || wfStatus == "Denied") 
{
	var workflowResult = aa.workflow.getTaskItems(capId, wfTask, wfProcess, null, null, null);
	if (workflowResult.getSuccess())
	{
		wfObj = workflowResult.getOutput();
	}
	else 
	{
		logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
	}
	for (var i in wfObj) 
	{
		fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfTask.toUpperCase()) && fTask.getProcessCode().equals(wfProcess))
		{
			var taskUserObj = fTask.getTaskItem().getAssignedUser()
			assignEmail = taskUserObj.getEmail();
		}
	}
	var emailTemplateName = "CANAL_WFCANCELED"
	var eParams = aa.util.newHashtable();
	addParameter(eParams, "$$alias$$", cap.getCapType().getAlias());
	addParameter(eParams, "$$altId$$",capIDString);
	addParameter(eParams, "$$wfStatus", wfStatus);
	PAemailList = getUserEmailsByTitle("Permit Administrator");
	logDebug(PAemailList.join(","));
	for (e in PAemailList)
	{
		if (!matches(assignEmail, null, undefined, ""))
		{
			sendNotification("noreply@nypa.com", PAemailList[e], assignEmail, emailTemplateName, eParams, null);
		}
		else
		{
			sendNotification("noreply@nypa.com", PAemailList[e], "", emailTemplateName, eParams, null);
		}
	}
	var aEmail = getCreatedByEmail(capId);
	if (!matches(aEmail, null, "", undefined))
	{
		sendNotification("noreply@nypa.com", aEmail, "", emailTemplateName, eParams, null);
	}
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