/*-------------------------------------------------------------------------------------------------------/
 Program:	Create Invoice
 Client:	NYPA

 Frequency:	1st of the month

 Description: Create the invoice the record with the term fee when the Permit or Lease record has a Next Invoice Date in the current month
/--------------------------------------------------------------------------------------------------------*/
/*-------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/--------------------------------------------------------------------------------------------------------*/
var emailText = "";
var debugText = "";
var showDebug = false;
var showMessage = false;
var message = "";
var maxSeconds = 60 * 60;
var br = "<br>";
var publicUser = false

/*-------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/--------------------------------------------------------------------------------------------------------*/
sysDate = aa.date.getCurrentDate();
batchJobResult = aa.batchJob.getJobID()
batchJobName = "" + aa.env.getValue("BatchJobName");
wfObjArray = null;
var SCRIPT_VERSION = 3.0;

eval(getMasterScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_BATCH"));
eval(getMasterScriptText("INCLUDES_CUSTOM"));

override = "function logDebug(dstr){ if(showDebug) { emailText+= dstr + \"<br>\"; } }";
eval(override);


function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";
}

function getMasterScriptText(vScriptName) {
    vScriptName = vScriptName.toUpperCase();
    var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
    var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(), vScriptName);
    return emseScript.getScriptText() + "";
}

showDebug = true;
batchJobID = 0;
if (batchJobResult.getSuccess())
  {
  batchJobID = batchJobResult.getOutput();
  logDebug("Batch Job " + batchJobName + " Job ID is " + batchJobID);
  }
else{
  logDebug("Batch job ID not found " + batchJobResult.getErrorMessage());
}
logDebug("=========================");

/*----------------------------------------------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------------------------------------------*/
/* test parameters *
aa.env.setValue("lookAheadMonths", "0");
aa.env.setValue("Custom_Field_Name", "Next Invoice Date");
aa.env.setValue("Custom_Field_Group", "EFFECTIVE DATE");
aa.env.setValue("emailLog", "N");
aa.env.setValue("emailAddress", "mlinscheid@accela.com");
aa.env.setValue("sysFromEmail", "noreply@sandiego.gov");
//***********************/
var paramStdChoice = aa.env.getValue("paramStdChoice")

var lookAheadMonths = parseInt(aa.env.getValue("lookAheadMonths"));
var asiName = aa.env.getValue("Custom_Field_Name");
var asiGroup = aa.env.getValue("Custom_Field_Group");
var emailLog = aa.env.getValue("emailLog");
var emailAddress = aa.env.getValue("emailAddress");			// email to send report
var sysFromEmail = aa.env.getValue("sysFromEmail");

/*-----------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startJSDate = new Date();
startJSDate.setHours(0,0,0,0);
startJSDate.setDate(1);
startJSDate.setMonth(startJSDate.getMonth() + lookAheadMonths)
var timeExpired = false;
var useAppSpecificGroupName = false;

var startTime = startDate.getTime();			// Start timer
var currentUserID = "ADMIN";
var systemUserObj = aa.person.getUser("ADMIN").getOutput();


var fromJSDate = new Date(startJSDate.getTime());
var toJSDate = new Date(startJSDate.getTime());
toJSDate.setMonth(toJSDate.getMonth()+1);
toJSDate.setDate(0);

var dFromDate = aa.date.parseDate(jsDateToASIDate(fromJSDate));
var dToDate = aa.date.parseDate(jsDateToASIDate(toJSDate));

logDebug("fromJSDate: " + fromJSDate);
logDebug("toJSDate: " + toJSDate);

/*------------------------------------------------------------------------------------------------/
|
| <===========Main=Loop================>
|
/-------------------------------------------------------------------------------------------------*/

logDebug("=========================");
logDebug("Start of Job");

mainProcess();

logDebug("End of Job: Elapsed Time : " + elapsed() + " Seconds");

if (emailAddress.length && emailLog=="Y"){
	logDebug("Email will be sent to: " + emailAddress);
	//logDebug(emailText);
	aa.sendMail(sysFromEmail, emailAddress, "", batchJobName + " Results", emailText);
}
if (showDebug) {
	aa.eventLog.createEventLog("DEBUG", "Batch Process", batchJobName, aa.date.getCurrentDate(), aa.date.getCurrentDate(),"", emailText ,batchJobID);
}
logDebug(emailText);
/*---------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/---------------------------------------------------------------------------------------------------------*/


function mainProcess() {
	try{
		var capCount = 0;
		//var setID = (setNameIDPrefix + " " + fromJSDate.getFullYear().toString().substr(0, 4) + "-" + ("0"+(fromJSDate.getMonth() + 1)).slice(-2)).toUpperCase()
		var capResult = aa.cap.getCapIDsByAppSpecificInfoDateRange(asiGroup,asiName,dFromDate,dToDate);
		if (!capResult.getSuccess()) {
			logDebug("Error: Getting records, reason is: " + capResult.getErrorMessage()) ;
			emailText+= "Error: Getting records, reason is: " + capResult.getErrorMessage() + br;
		}
		else {
			myCaps = capResult.getOutput();
			logDebug("Found " + myCaps.length + " records to process");

			for (myCapsXX in myCaps) {
				if (elapsed() > maxSeconds) { // only continue if time hasn't expired
					logDebug("WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
					emailText+="WARNING: A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed." + br;
					timeExpired = true ;
					break;
				}
				var thisCapId = myCaps[myCapsXX].getCapID();
				capId = aa.cap.getCapID(thisCapId.getID1(), thisCapId.getID2(), thisCapId.getID3()).getOutput();
				if (!capId) {
					logDebug("Could not get Cap ID");
					emailText+="Could not get Cap ID" + br;
					continue;
				}
				cap = aa.cap.getCap(capId).getOutput();
				altId = capId.getCustomID();
				var appTypeResult = cap.getCapType();
				var appTypeString = appTypeResult.toString();
				appTypeArray = appTypeString.split("/");

				if (!appMatch("CANALS/Occupancy/Permit/NA",capId) && !appMatch("CANALS/Lease/NA/NA",capId)) {
					logDebug("Skipping "+altId+" bescause it is not CANALS/Occupancy/Permit/NA or CANALS/Occupancy/Lease/NA" );
					continue;
				}

				capCount++;
				asiExpDate = getAppSpecific(asiName)
				logDebug("Processing " + altId + " (Next Invoice Date: " + asiExpDate +")");

				try {
					childId = createChild("CANALS", "Occupancy", "Invoice", "NA", "Invoice created on " + jsDateToASIDate(startDate), capId)
					AInfo = []
					loadAppSpecific(AInfo, capId);
					copyAppSpecific(childId)
					copyASITables(capId, childId)
					aa.cap.copyCapWorkDesInfo(capId, childId);
					aa.cap.copyCapDetailInfo(capId, childId);
					copyAdditionalInfo(capId, childId);

					addFee("CNL-OC-INV", "CANAL-OC-I", "FINAL", 1, "Y", childId)
				}
				catch(errrr) {
					logDebug("Error creating invoice record for record "+altId+": "+errrr)
				}

				nextInvDate = new Date(fromJSDate.getTime())
				try {
					nextInvDate = new Date(getAppSpecific("Next Invoice Date"))
				} catch(err){
					//use current month as default
				}

				var addMonths = 12
				switch (""+getAppSpecific("Permit Term")) {
					case "ANNUAL":
						addMonths = 12;
						break;
					case "SEMI-ANNUAL":
						addMonths = 6;
						break;
					case "QUARTERLY":
						addMonths = 3;
						break;
					case "MONTHLY":
						addMonths = 1;
						break;
				}
				nextInvDate.setMonth(nextInvDate.getMonth() + addMonths)

				editAppSpecific("Last Invoice Date", jsDateToASIDate(startDate), capId)
				editAppSpecific("Next Invoice Date", jsDateToASIDate(nextInvDate), capId)
			}

			logDebug("=========================");
			logDebug("Total number of invoices created: " + capCount );
		}
	}
	catch (err){
		logDebug("A JavaScript Error occurred: mainProcess: " + err.message);
		emailText+= "A JavaScript Error occurred: mainProcess: " + err.message + br;
	}
}

/*---------------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/----------------------------------------------------------------------------------------------------------------*/

function loadAppSpecific(thisArr, itemCap) {
	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess()) {
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj) {
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			}
		}
	}
