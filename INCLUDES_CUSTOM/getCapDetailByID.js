function getCapDetailByID(capId) {
	capDetailScriptModel = null;
	var s_result = aa.cap.getCapDetail(capId);
	if (s_result.getSuccess()) {
		capDetailScriptModel = s_result.getOutput();
		if (capDetailScriptModel == null) {
			aa.print("WARNING: no cap detail on this CAP:" + capId);
			capDetailScriptModel = null;
		}
	} else {
		aa.print("ERROR: Failed to get cap detail: " + s_result.getErrorMessage());
		capDetailScriptModel = null;
	}
	// Return capDetailScriptModel
	return capDetailScriptModel;
}
