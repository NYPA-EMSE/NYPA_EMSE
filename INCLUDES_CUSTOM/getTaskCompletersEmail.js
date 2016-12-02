function getTaskCompletersEmail(wfstr) {
	try {
		var itemCap = capId;
		if (arguments.length == 2) {
			itemCap = arguments[1]; // subprocess
		}

		if (matches(""+wfstr,"null","") ) return null

		var workflowResult = aa.workflow.getTaskItems(itemCap, ""+wfstr, "", null, null, null);
		
		if (workflowResult.getSuccess())
			wfHistObj = workflowResult.getOutput();
		else {
			logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
			return null;
		}

		for (i in wfHistObj) {
			var AAUserObj = aa.people.getSysUserByID(""+wfHistObj[i].getTaskItem().getAuditID())
			if (!AAUserObj.getSuccess()){
				logMessage("**ERROR: Failed to get User object: " + AAUserObj.getErrorMessage());
				return null;
			}
			else {
				return ""+AAUserObj.getOutput().getEmail()
			}
		}
	}
	catch (err) {
		logDebug("A JavaScript Error occurred: getTaskCompletersEmail(): " + err.message);
		logDebug(err.stack)
	}
	return null
}
