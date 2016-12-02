var myCapId = "C-OC-201600001-I";
var myUserId = "ADMIN";

var eventName = "WorkflowTaskUpdateBefore"; wfTask = "DPE Complete"; wfStatus = "Complete"
var useProductScript = true;  // set to true to use the "productized" master scripts (events->master scripts), false to use scripts from (events->scripts)
var runEvent = true; // set to true to simulate the event and run all std choices/scripts for the record type.  
/* master script code don't touch */ aa.env.setValue("EventName",eventName); var vEventName = eventName;  var controlString = eventName;  var tmpID = aa.cap.getCapID(myCapId).getOutput(); if(tmpID != null){aa.env.setValue("PermitId1",tmpID.getID1()); 	aa.env.setValue("PermitId2",tmpID.getID2()); 	aa.env.setValue("PermitId3",tmpID.getID3());} aa.env.setValue("CurrentUserID",myUserId); var preExecute = "PreExecuteForAfterEvents";var documentOnly = false;var SCRIPT_VERSION = 3.0;var useSA = false;var SA = null;var SAScript = null;var bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_FOR_EMSE"); if (bzr.getSuccess() && bzr.getOutput().getAuditStatus() != "I") { 	useSA = true; 		SA = bzr.getOutput().getDescription();	bzr = aa.bizDomain.getBizDomainByValue("MULTI_SERVICE_SETTINGS","SUPER_AGENCY_INCLUDE_SCRIPT"); 	if (bzr.getSuccess()) { SAScript = bzr.getOutput().getDescription(); }	}if (SA) {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",SA,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",SA,useProductScript));	/* force for script test*/ showDebug = true; eval(getScriptText(SAScript,SA,useProductScript));	}else {	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS",null,useProductScript));	eval(getScriptText("INCLUDES_ACCELA_GLOBALS",null,useProductScript));	}	eval(getScriptText("INCLUDES_CUSTOM",null,useProductScript));if (documentOnly) {	doStandardChoiceActions2(controlString,false,0);	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");	aa.abortScript();	}var prefix = lookup("EMSE_VARIABLE_BRANCH_PREFIX",vEventName);var controlFlagStdChoice = "EMSE_EXECUTE_OPTIONS";var doStdChoices = true;  var doScripts = false;var bzr = aa.bizDomain.getBizDomain(controlFlagStdChoice ).getOutput().size() > 0;if (bzr) {	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"STD_CHOICE");	doStdChoices = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	var bvr1 = aa.bizDomain.getBizDomainByValue(controlFlagStdChoice ,"SCRIPT");	doScripts = bvr1.getSuccess() && bvr1.getOutput().getAuditStatus() != "I";	}	function getScriptText(vScriptName, servProvCode, useProductScripts) {	if (!servProvCode)  servProvCode = aa.getServiceProviderCode();	vScriptName = vScriptName.toUpperCase();	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();	try {		if (useProductScripts) {			var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);		} else {			var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(), vScriptName, "ADMIN");		}		return emseScript.getScriptText() + "";	} catch (err) {		return "";	}}logGlobals(AInfo); if (runEvent && typeof(doStandardChoiceActions) == "function" && doStdChoices) try {doStandardChoiceActions(controlString,true,0); } catch (err) { logDebug(err.message) } if (runEvent && typeof(doScriptActions) == "function" && doScripts) doScriptActions(); var z = debug.replace(/<BR>/g,"\r");  aa.print(z); 
eval("function logDebug(dstr) { aa.print(dstr); } function logMessage(dstr) { aa.print(dstr); }")

logDebug("_____________TEST______________")



/**************************************************************************************************************
*	ID-1 - Send Email Review & Approval
*	Mike Linscheid
*/
try{
	if (wfTask == "DPE Complete" && wfStatus == "Complete" ) {
		var emailTemplateName = "CANAL_REVIEW_AND_APPROVAL"
		applicantName = "-NA-"
		conArr = getContactArray();
		for (c in conArr) {
			if (conArr[c]["contactType"] == "Applicant" ) {
				applicantName = conArr[c]["firstName"] + " " + conArr[c]["lastName"]
				break
			}
		}
		
		var eParams = aa.util.newHashtable(); 
		addParameter(eParams, "$$alias$$ ", cap.getCapType().getAlias())
		addParameter(eParams, "$$altId$$",capIDString)
		addParameter(eParams, "$$applicantName$$", applicantName)
		//addParameter(eParams, "$$status$$", capStatus)
		//addParameter(eParams, "$$userId$$", currentUserID)
		
		DLMemailList = getUserEmailsByTitle("Director of Land Management")
		PAemailList = getUserEmailsByTitle("Permit Administrator")
		
		for (e in DLMemailList) sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null)
		for (e in PAemailList) sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null)
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/New/NA: #01: " + err.message);
	logDebug(err.stack)
}		
		
/**************************************************************************************************************
*	ID-2 - Send Email Active
*	Mike Linscheid
*/
try{
	if (wfTask == "Issuance" && wfStatus == "Issued" ) {
		var emailTemplateName = "CANAL_ACTIVE"
		applicantName = "-NA-"
		conArr = getContactArray();
		for (c in conArr) {
			if (conArr[c]["contactType"] == "Applicant" ) {
				applicantName = conArr[c]["firstName"] + " " + conArr[c]["lastName"]
				break
			}
		}
		
		var eParams = aa.util.newHashtable(); 
		addParameter(eParams, "$$alias$$ ", cap.getCapType().getAlias())
		addParameter(eParams, "$$altId$$",capIDString)
		addParameter(eParams, "$$applicantName$$", applicantName)
		//addParameter(eParams, "$$status$$", capStatus)
		addParameter(eParams, "$$userId$$", currentUserID)
		
		DLMemailList = getUserEmailsByTitle("Director of Land Management")
		PAemailList = getUserEmailsByTitle("Permit Administrator")
		
		for (e in DLMemailList) sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null)
		for (e in PAemailList) sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null)
		
		//Send to WORKFLOW People
		sendNotification(sysFromEmail, getTaskCompletersEmail("Application Entry"), "", emailTemplateName, eParams, null)
		sendNotification(sysFromEmail, getTaskCompletersEmail("DPE Complete"), "", emailTemplateName, eParams, null)
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/New/NA: #02: " + err.message);
	logDebug(err.stack)
}

/**************************************************************************************************************
*	ID-4 - Send Email Approved
*	Mike Linscheid
*/
try{
	if (wfTask == "HQ Review" && wfStatus == "Approved" && capStatus == "Active") {
		var emailTemplateName = "CANAL_APPROVED"
		applicantName = "-NA-"
		conArr = getContactArray();
		for (c in conArr) {
			if (conArr[c]["contactType"] == "Applicant" ) {
				applicantName = conArr[c]["firstName"] + " " + conArr[c]["lastName"]
				break
			}
		}
		
		var eParams = aa.util.newHashtable(); 
		addParameter(eParams, "$$alias$$ ", cap.getCapType().getAlias())
		addParameter(eParams, "$$altId$$",capIDString)
		addParameter(eParams, "$$applicantName$$", applicantName)
		//addParameter(eParams, "$$status$$", capStatus)
		addParameter(eParams, "$$userId$$", currentUserID)
		
		DLMemailList = getUserEmailsByTitle("Director of Land Management")
		PAemailList = getUserEmailsByTitle("Permit Administrator")
		
		for (e in DLMemailList) sendNotification(sysFromEmail, DLMemailList[e], "", emailTemplateName, eParams, null)
		for (e in PAemailList) sendNotification(sysFromEmail, PAemailList[e], "", emailTemplateName, eParams, null)
		
		//Send to WORKFLOW People
		sendNotification(sysFromEmail, getTaskCompletersEmail("Application Entry"), "", emailTemplateName, eParams, null)
		sendNotification(sysFromEmail, getTaskCompletersEmail("DPE Complete"), "", emailTemplateName, eParams, null)
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: WTUA:CANALS/Occupancy/New/NA: #04: " + err.message);
	logDebug(err.stack)
}

