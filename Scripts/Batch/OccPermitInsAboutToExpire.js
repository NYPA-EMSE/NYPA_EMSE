/*------------------------------------------------------------------------------------------------------/
| Program: Occupancy Permit Insurance About to Expire  Trigger: Batch
| Client: NYPA
| Version 1.0 Jeff Moyer 7/12/2017
| Description: if any of the insurances defined in the Custom List are about to expire within the next 
| 30 days, and set record status to 'About to Expire' 
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START: USER CONFIGURABLE PARAMETERS
/------------------------------------------------------------------------------------------------------*/
var maxMinutes = 5;
var maxSeconds = 60 * maxMinutes; //number of seconds allowed for batch processing, usually < 60 * 5
var showDebug = true; //Set to true to see debug messages in email confirmation
var showMessage = false;
var useAppSpecificGroupName = true;
var emailText = "";
var br = "<BR>";

sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID();
batchJobName = "" + aa.env.getValue("BatchJobName");
batchJobID = 0;
if (batchJobResult.getSuccess())
{
	batchJobID = batchJobResult.getOutput();
	logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID + br);
}
else
{
	logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());
}

var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var timeExpired = false;
var startDate = new Date();
var startTime = startDate.getTime(); // Start timer
var emailAddress = "jeffrey.moyer@scubeenterprise.com";//email to send report
var capId;
var capIDString;
var cap;
var capStatus = "";
var capName = "";
var issueDate;
var wfTask = "";
var wfStatus = "";
/*----------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
/----------------------------------------------------------------------------------------------------*/
var paramsOK = true;

if (paramsOK) 
{
	logDebug("Start Date: " + startDate + br);
	logDebug("Starting the timer for this job.  If it takes longer than " + maxMinutes + " minutes an error will be listed at the bottom of the email." + br);
	if (!timeExpired) 
	{
		mainProcess();
		logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");
		logDebug("End Date: " + startDate);
		aa.sendMail("noreply@osceolacounty.gov", emailAddress, "", "PW Bond About to Expire Records", emailText);
	}
}

/*-----------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/-----------------------------------------------------------------------------------------------------*/
function mainProcess()
{
	var fromDate = aa.date.getCurrentDate();
	var toDate = aa.date.getScriptDateTime(aa.util.parseDate((startDate.getMonth() + 1) + "/" + startDate.getDate() + "/" + (startDate.getFullYear() + 3)));
	var capIdList = aa.cap.getCapIDsByAppSpecificInfoDateRange("EFFECTIVE DATE", "Next Invoice Date", fromDate, toDate);
	if (capIdList.getSuccess()) 
	{
		var capIds = capIdList.getOutput();
		logDebug("**The number of records with a future Invoice Date: " + capIds.length + br);
		for (c = 0; c < capIds.length; c++) 
		{
			if (elapsed() > maxSeconds) 
			{ //only continue if time hasn't expired
				logDebug("A script time-out has caused partial completion of this process.  Please re-run.  " + elapsed() + 
					" seconds elapsed, " + maxSeconds + " allowed.");
				timeExpired = true;
				break;
			}
			var cId = workflows[wf].getCapID();
			capId = aa.cap.getCapID(cId.getID1(), cId.getID2(), cId.getID3()).getOutput(); 
			capIDString = capId.getCustomID();
			cap = aa.cap.getCap(capId).getOutput();
			var emailParams = aa.util.newHashtable();
			var reportParams = aa.util.newHashtable();
			var reportFile = new Array();
			var conArray = getContactArray();
			var conEmail = "";
			if (cap) 
			{
				var appTypeResult = cap.getCapType();
				var appTypeString = appTypeResult.toString();
				var appTypeArray = appTypeString.split("/");
				/*
				if(appTypeArray[0] == "PublicWorks" && appTypeArray[1] == "Bond" && appTypeArray[2] == "NA" && appTypeArray[3] == "NA") 
				{
					capStatus = cap.getCapStatus();
					var expDate = getAppSpecific("RECORD INFROMATION.Expiration Date");
					var expireDate = "";
					var compareDate = "";
					if (!matches(expDate, null, undefined, ""))
					{
						expireDate = new Date(expDate);
						compareDate = new Date(expDate);
						compareDate = new Date(dateAdd(compareDate, -45));
						logDebug("Expire Date: " + expireDate);
					}
					else
					{
						logDebug("Expire Date NOT set");
					}
					if (startDate >= compareDate)
					{
						logDebug("Record Number: " + capIDString);
						logDebug("Record Status: " + capStatus);
						logDebug("Workflow Task: " + wfTask);
						logDebug("Workflow Status: " + wfStatus);
						logDebug("Bond Approval Date: " + issDate + br);
						
					}
				}
				*/
			}
		}
	}
	else 
	{
		logDebug("ERROR: Retrieving permits: " + wfList.getErrorType() + ":" + wfList.getErrorMessage());
		return false;
	}
}

/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

function sendNotification(emailFrom, emailTo, emailCC, templateName, params, reportFile)
{
	var itemCap = capId;
	if (arguments.length == 7) itemCap = arguments[6]; // use cap ID specified in args
	var id1 = itemCap.ID1;
 	var id2 = itemCap.ID2;
 	var id3 = itemCap.ID3;
	var capIDScriptModel = aa.cap.createCapIDScriptModel(id1, id2, id3);
	var result = null;
	result = aa.document.sendEmailAndSaveAsDocument(emailFrom, emailTo, emailCC, templateName, params, capIDScriptModel, reportFile);
	if(result.getSuccess())
	{
		logDebug("Sent email successfully!");
		return true;
	}
	else
	{
		logDebug("Failed to send mail. - " + result.getErrorType());
		return false;
	}
}

function addParameter(pamaremeters, key, value)
{
	if(key != null)
	{
		if(value == null)
		{
			value = "";
		}
		pamaremeters.put(key, value);
	}
}

function updateAppStatus(stat,cmt) {
	updateStatusResult = aa.cap.updateAppStatus(capId,"APPLICATION",stat, sysDate, cmt ,systemUserObj);
	if (!updateStatusResult.getSuccess()) {
		logDebug("ERROR: application status update to " + stat + " was unsuccessful.  The reason is "  + 
		updateStatusResult.getErrorType() + ":" + updateStatusResult.getErrorMessage());
	} else {
		logDebug("Application Status updated to " + stat);
	}
}

function getContactArray()
{
	// Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
	// optional capid
	// added check for ApplicationSubmitAfter event since the contactsgroup array is only on pageflow,
	// on ASA it should still be pulled normal way even though still partial cap
	var thisCap = capId;
	if (arguments.length == 1) thisCap = arguments[0];
	var cArray = new Array();
	if (arguments.length == 0 && !cap.isCompleteCap() && controlString != "ApplicationSubmitAfter") // we are in a page flow script so use the capModel to get contacts
	{
	capContactArray = cap.getContactsGroup().toArray() ;
	}
	else
	{
	var capContactResult = aa.people.getCapContactByCapID(thisCap);
	if (capContactResult.getSuccess())
		{
		var capContactArray = capContactResult.getOutput();
		}
	}

	if (capContactArray)
	{
	for (yy in capContactArray)
		{
		var aArray = new Array();
		aArray["lastName"] = capContactArray[yy].getPeople().lastName;
		aArray["refSeqNumber"] = capContactArray[yy].getCapContactModel().getRefContactNumber();
		aArray["firstName"] = capContactArray[yy].getPeople().firstName;
		aArray["middleName"] = capContactArray[yy].getPeople().middleName;
		aArray["businessName"] = capContactArray[yy].getPeople().businessName;
		aArray["contactSeqNumber"] =capContactArray[yy].getPeople().contactSeqNumber;
		aArray["contactType"] =capContactArray[yy].getPeople().contactType;
		aArray["relation"] = capContactArray[yy].getPeople().relation;
		aArray["phone1"] = capContactArray[yy].getPeople().phone1;
		aArray["phone2"] = capContactArray[yy].getPeople().phone2;
		aArray["email"] = capContactArray[yy].getPeople().email;
		aArray["addressLine1"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine1();
		aArray["addressLine2"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine2();
		aArray["city"] = capContactArray[yy].getPeople().getCompactAddress().getCity();
		aArray["state"] = capContactArray[yy].getPeople().getCompactAddress().getState();
		aArray["zip"] = capContactArray[yy].getPeople().getCompactAddress().getZip();
		aArray["fax"] = capContactArray[yy].getPeople().fax;
		aArray["notes"] = capContactArray[yy].getPeople().notes;
		aArray["country"] = capContactArray[yy].getPeople().getCompactAddress().getCountry();
		aArray["fullName"] = capContactArray[yy].getPeople().fullName;
		aArray["peopleModel"] = capContactArray[yy].getPeople();

		var pa = new Array();

		if (arguments.length == 0 && !cap.isCompleteCap()) {
			var paR = capContactArray[yy].getPeople().getAttributes();
			if (paR) pa = paR.toArray();
			}
		else
			var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
				for (xx1 in pa)
					aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;

		cArray.push(aArray);
		}
	}
	return cArray;
}

function getRecordParams4Notification(params) 
{
	// pass in a hashtable and it will add the additional parameters to the table
	addParameter(params, "$$altID$$", capIDString);
	addParameter(params, "$$capName$$", capName);
	addParameter(params, "$$capStatus$$", capStatus);
	return params;
}

function getAppSpecific(itemName) { //optional: itemCap
	var updated = false;
	var i = 0;
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args
	if (useAppSpecificGroupName) {
		if (itemName.indexOf(".") < 0) {
			logDebug("**WARNING: editAppSpecific requires group name prefix when useAppSpecificGroupName is true"); 
			return false 
		}
		var itemGroup = itemName.substr(0,itemName.indexOf("."));
		var itemName = itemName.substr(itemName.indexOf(".") + 1);
	}
	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess()) {
		var appspecObj = appSpecInfoResult.getOutput();
		if (itemName != "") {
			for (i in appspecObj) {
				if (appspecObj[i].getCheckboxDesc() == itemName && (!useAppSpecificGroupName || appspecObj[i].getCheckboxType() == itemGroup)) {
					return appspecObj[i].getChecklistComment();
					break;
				}
			}
		}
	} else { 
		logDebug( "**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage())
	}
}

function taskCloseAllNotComplete(pStatus, pComment) {
	var taskArray = new Array();
	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess()) {
  	 	var wfObj = workflowResult.getOutput();
	} else { 
		logDebug("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); 
		return false; 
	}
	var fTask;
	var stepnumber;
	var processID;
	var dispositionDate = aa.date.getCurrentDate();
	var wfnote = " ";
	var wftask;
	for (i in wfObj) {
		fTask = wfObj[i];
		wftask = fTask.getTaskDescription();
		stepnumber = fTask.getStepNumber();
		processID = fTask.getProcessID();
		if (wftask.equals("Inspection") || wftask.equals("Certificate of Occupancy") || wftask.equals("Closed")) {
			if (fTask.getCompleteFlag().equals("N")) {
					aa.workflow.handleDisposition(capId, stepnumber, pStatus, dispositionDate, wfnote, pComment, systemUserObj,"Y");
					logDebug("Closing Work flow Task " + wftask + " with status " + pStatus);
			}
		}
	}
}

function matches(eVal, argList) {
	for (var i = 1; i < arguments.length; i++) {
		if (arguments[i] == eVal) {
			return true;
		}
	}
	return false;
} 

function dateAdd(td, amt) {
	// perform date arithmetic on a string
	// td can be "mm/dd/yyyy" (or any string that will convert to JS date)
	// amt can be positive or negative (5, -3) days
	// if optional parameter #3 is present, use working days only
	var dDate;
	var useWorking = false;
	if (arguments.length == 3) {
		useWorking = true;
	}
	if (!td) {
		dDate = new Date();
	} else {
		dDate = td;
	}
	var i = 0;
	if (useWorking) {
		if (!aa.calendar.getNextWorkDay) {
			logDebug("getNextWorkDay function is only available in Accela Automation 6.3.2 or higher.");
			while (i < Math.abs(amt)) {
				dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * (amt > 0 ? 1 : -1)));
				if (dDate.getDay() > 0 && dDate.getDay() < 6) {
					i++
				}
			}
		} else {
			while (i < Math.abs(amt)) {
				dDate = new Date(aa.calendar.getNextWorkDay(aa.date.parseDate(dDate.getMonth() + 1 + "/" + dDate.getDate() + "/" + dDate.getFullYear())).getOutput().getTime());
				i++;
			}
		}
	} else {
		dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * amt));
	}
	return (dDate.getMonth() + 1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();
}

function dateAddMonths(pDate, pMonths) {
	// Adds specified # of months (pMonths) to pDate and returns new date as string in format MM/DD/YYYY
	// If pDate is null, uses current date
	// pMonths can be positive (to add) or negative (to subtract) integer
	// If pDate is on the last day of the month, the new date will also be end of month.
	// If pDate is not the last day of the month, the new date will have the same day of month, unless such a day doesn't exist in the month,
	// in which case the new date will be on the last day of the month
	if (!pDate) {
		baseDate = new Date();
	} else {
		baseDate = convertDate(pDate);
	}
	var day = baseDate.getDate();
	baseDate.setMonth(baseDate.getMonth() + pMonths);
	if (baseDate.getDate() < day) {
		baseDate.setDate(1);
		baseDate.setDate(baseDate.getDate() - 1);
	}
	return ((baseDate.getMonth() + 1) + "/" + baseDate.getDate() + "/" + baseDate.getFullYear());
}

function convertDate(thisDate) {
	//converts date to javascript date
	if (typeof(thisDate) == "string") {
		var retVal = new Date(String(thisDate));
		if (!retVal.toString().equals("Invalid Date"))
			return retVal;
	}
	if (typeof(thisDate) == "object") {
		if (!thisDate.getClass) { // object without getClass, assume that this is a javascript date already
			return thisDate;
		}
		if (thisDate.getClass().toString().equals("class com.accela.aa.emse.dom.ScriptDateTime")) {
			return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
		}
		if (thisDate.getClass().toString().equals("class java.util.Date")) {
			return new Date(thisDate.getTime());
		}
		if (thisDate.getClass().toString().equals("class java.lang.String")) {
			return new Date(String(thisDate));
		}
	}
	if (typeof(thisDate) == "number") {
		return new Date(thisDate); // assume milliseconds
	}
	logDebug("**WARNING** convertDate cannot parse date : " + thisDate);
	return null;
}

function jsDateToMMDDYYYY(pJavaScriptDate) {
	//converts javascript date to string in MM/DD/YYYY format
	if (pJavaScriptDate != null) {
		if (Date.prototype.isPrototypeOf(pJavaScriptDate)) {
			return (pJavaScriptDate.getMonth() + 1).toString() + "/" + pJavaScriptDate.getDate() + "/" + pJavaScriptDate.getFullYear();
		} else {
			logDebug("Parameter is not a javascript date");
			return ("INVALID JAVASCRIPT DATE");
		}
	} else {
		logDebug("Parameter is null");
		return ("NULL PARAMETER VALUE");
	}
}

function debugObject(object) {
	var output = '';
	for (property in object) {
		output += "<font color=red>" + property + "</font>" + ': ' + "<bold>" + object[property] + "</bold>" + '; ' + "<BR>";
	}
	logDebug(output);
}

function elapsed() {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000)
}

function logDebug(dstr) {
	if (showDebug) {
		aa.print(dstr)
		emailText += dstr + "<br>";
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)
	}
}

function comment(cstr) {
	if (showDebug) logDebug(cstr);
	if (showMessage) logMessage(cstr);
}