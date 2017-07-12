
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
			//sendNotification("noreply@nypa.com", PAemailList[e], assignEmail, emailTemplateName, eParams, null);
			sendNotification("noreply@nypa.com", "jeffrey.moyer@scubeenterprise.com", "", emailTemplateName, eParams, null);
		}
		else
		{
			//sendNotification("noreply@nypa.com", PAemailList[e], "", emailTemplateName, eParams, null);
			sendNotification("noreply@nypa.com", "jeffrey.moyer@scubeenterprise.com", "", emailTemplateName, eParams, null);
		}
	}
}