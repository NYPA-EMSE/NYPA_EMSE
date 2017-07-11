
showDebug = true;

if (wfStatus == "Void" || wfStatus == "Withdrawn" || wfStatus == "Denied") 
{
	var processName = "CANALS-OCC-NEW";
	var workflowResult = aa.workflow.getTaskItems(capId, wfstr, processName, null, null, null);
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
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) && fTask.getProcessCode().equals(processName))
		{
			var taskUserObj = fTask.getTaskItem().getAssignedUser()
		}
	}
	var emailTemplateName = "CANAL_WFCANCELED"
	var eParams = aa.util.newHashtable();
	addParameter(eParams, "$$alias$$", cap.getCapType().getAlias());
	addParameter(eParams, "$$altId$$",capIDString);
	addParameter(eParams, "$$applicantName$$", applicantName);
	addParameter(eParams, "$$wfStatus", wfStatus);
	PAemailList = getUserEmailsByTitle("Permit Administrator");
	logDebug(PAemailList.join(","));
	for (e in PAemailList)
	{
		//sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null);
	}
}