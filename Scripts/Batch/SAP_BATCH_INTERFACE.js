/***
*	Agency: NYPA
*	Author: Mike Linscheid
*
*	Description: Send Invoice data from Occupancy Invoice records to an adapter that will then move the data as a file to an SFTP server
***/

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_CUSTOM"));
//eval(getScriptText("INCLUDES_CUSTOM_GLOBALS"));
var DEBUG_NEW_LINE = ("" + aa.env.getValue("BatchJobName") == "") ? "\n" : "<br>";
var TIMEOUT = ("" + aa.env.getValue("BatchJobName") == "") ? 300 : 60*60
var sysDate = aa.date.getCurrentDate();
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var PACKET_ERROR = "";
override = "function logDebug(dstr){ aa.print(dstr + DEBUG_NEW_LINE); }";
eval(override);

function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	return emseScript.getScriptText() + "";
}

try {
	var SOAP_URL = "" + aa.env.getValue("InterfaceAdapterURL");
	var username = "" + aa.env.getValue("AdapterUsername");
	var password = "" + aa.env.getValue("AdapterPassword");
	var showFileData = "" + aa.env.getValue("showFileData");
	// !!!!!!!!!!!!!!!!!!!! Set Defaults  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	var envIndicator = ((""+aa.env.getValue("envIndicator")) == "")  ? "SUPPORT" : "" + aa.env.getValue("envIndicator");
	var emailTo = ((""+aa.env.getValue("emailTo")) == "")  ? "ashwinipradeep.tripuraneni@nypa.gov" : "" + aa.env.getValue("emailTo");
	var SOAP_ACTION = "http://tempuri.org/IService1/uploadFile"
	var today = new Date()
	var startTime = today.getTime();
	var MAX_RECORDS = aa.cap.getCapIDList().getOutput().length
	var MAX_USE_CODES = 10
	var DELIM = "|"
	var NEW_LINE = "\r\n"

	
	var FILE_TYPE = ".csv"
	var MAX_POST_LEN = 32768

	var FILE_NAME = "SAP_"+today.getFullYear() + "-"
	FILE_NAME += ("0"+(1+today.getMonth())).slice(-2) + "-"
	FILE_NAME += ("0"+today.getDate()).slice(-2) + "-"
	FILE_NAME += ("0"+today.getHours()).slice(-2) + "-"
	FILE_NAME += ("0"+today.getMinutes()).slice(-2)

	if(envIndicator != "PRODUCTION"){
		FILE_NAME = envIndicator + "_" + FILE_NAME;
	}

	var processTimeout = false

	capList = aa.cap.getByAppType("CANALS","Occupancy","Invoice","NA",0,MAX_RECORDS).getOutput()

	HEADER = ["CUSTOMER NUMBER",
						"REFERNCE CUSTOMER NUMBER",
						"CUSTOMER NAME",
						"STREET1",
						"STREET2",
						"ZIP CODE",
						"CITY",
						"STATE",
						"COUNTRY",
						"INVOICE RECORD NUMBER",
						"INVOICE NUMBER",
						"INVOICE AMOUNT",
						"INVOICE DATE",
						"PERMIT NUMBER",
						"PLATE NUMBER",
						"PERMIT LOCATION",
						"PERMIT RECORD TYPE"]

	//Custom Filed Mapping
	PLATE_NUMBER = "Plate #"
	PERMIT_LOCATION = "Permit Location"

	/////////////////////////////// Base 64 Ecoding ////////////////////////////////////////
	var Base64 = {
	    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	    encode: function(input) {
	        var output = "";
	        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	        var i = 0;
	        input = Base64._utf8_encode(input);

	        while (i < input.length) {
	            chr1 = input.charCodeAt(i++);
	            chr2 = input.charCodeAt(i++);
	            chr3 = input.charCodeAt(i++);

	            enc1 = chr1 >> 2;
	            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
	            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
	            enc4 = chr3 & 63;

	            if (isNaN(chr2)) {
	                enc3 = enc4 = 64;
	            } else if (isNaN(chr3)) {
	                enc4 = 64;
	            }
	            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
	        }
	        return output;
	    },
	    _utf8_encode: function(string) {
	        string = string.replace(/\r\n/g, "\n");
	        var utftext = "";

	        for (var n = 0; n < string.length; n++) {
	            var c = string.charCodeAt(n);
	            if (c < 128) {
	                utftext += String.fromCharCode(c);
	            }
	            else if ((c > 127) && (c < 2048)) {
	                utftext += String.fromCharCode((c >> 6) | 192);
	                utftext += String.fromCharCode((c & 63) | 128);
	            }
	            else {
	                utftext += String.fromCharCode((c >> 12) | 224);
	                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
	                utftext += String.fromCharCode((c & 63) | 128);
	            }
	        }
	        return utftext;
	    },
	}
	///////////////////////////// end Base 64 Ecoding ///////////////////////////////////////


	var SAP_Export = []
	SAP_Export.push(HEADER.join(DELIM))

	for (i in capList) {
		//if (i>=20) break
		if (elapsed(startTime) >= TIMEOUT) {
			processTimeout = true
			break
		}
		try {
			var newLine = []
			var capId = capList[i].getCapID()
			var cap = aa.cap.getCap(capId).getOutput();
			var capStatus = ""+cap.getCapStatus()
			if (capStatus == "Pending" || capStatus == "Open") {

				///////////// Get Billing Contact Data /////////////
				cNum = null
				cNumRef = null
				cName = null
				cStreet1 = null
				cStreet2 = null
				cZip = null
				cCity = null
				cState = null
				cCountry = null

				capContactObj = aa.people.getCapContactByCapID(capId);
				if (capContactObj.getSuccess()) {
					capContactList = capContactObj.getOutput()

					//Get Billing contact model
					var billingContactModel = null
					for ( c in capContactList ) {
						if (capContactList[c].getPeople().contactType == "Billing") {
							billingContactModel = capContactList[c].getCapContactModel()
							billingPeopleModel = capContactList[c].getPeople()
							cNum = billingPeopleModel.contactSeqNumber
							cNumRef = capContactList[c].getCapContactModel().getRefContactNumber() 	//If conact number should be reference number instead
							cName = (!matches(""+billingPeopleModel.firstName, "", "null")) ? billingPeopleModel.firstName + " " + billingPeopleModel.lastName : billingPeopleModel.businessName
							break
						}
					}

					if (billingContactModel) {
						var addressObj = aa.address.getContactAddressListByCapContact(billingContactModel);
						if (addressObj.getSuccess()) {
							addressList = addressObj.getOutput()
							foundMailingAddr = false
							for ( a in addressList )  {
								thisAddr = addressList[a].getContactAddressModel()
								//TODO choose address
								if (thisAddr.getAddressType() == "Mailing" && (!foundMailingAddr || thisAddr.getPrimaryFlag() == "Y")) {
									cStreet1 = thisAddr.getAddressLine1()
									cStreet2 = thisAddr.getAddressLine2()
									cZip = thisAddr.getZip()
									cCity = thisAddr.getCity()
									cState = thisAddr.getState()
									cCountry = thisAddr.getCountryCode()
								}
							}
						}
					}
				}

				///////////// Get Invoice Info /////////////
				var iNumber = null
				var iAmount = null
				var iDate = null
				var invoiceObj = aa.finance.getInvoiceByCapID(capId, null)
				if (invoiceObj.getSuccess()){
					invoiceList = invoiceObj.getOutput()
					for ( i in invoiceList ) {
						iNumber = invoiceList[i].getInvNbr();
						iAmount = invoiceList[i].getInvoiceModel().getBalanceDue();
						iDate = jsDateToASIDate(convertDate(invoiceList[i].getInvDate()))
						break
					}
				}

				///////////// Get Parent Alt ID /////////////
				parentAltId = null
				rType = null
				try {
					parentId = getParent()
					parentAltId = parentId.getCustomID()
					var parCap = aa.cap.getCap(parentId).getOutput();
					rType = (""+parCap.getCapType().getType()  == "Lease") ? "LS" : "OC"
				} catch (errrr) {
					// no parent
					parentAltId = null
					rType = null
				}

				///////////// Create SAP File Line /////////////
				newLine.push(cNum)
				newLine.push(cNumRef)
				newLine.push(cName)
				newLine.push(cStreet1)
				newLine.push(cStreet2)
				newLine.push(cZip)
				newLine.push(cCity)
				newLine.push(cState)
				newLine.push(cCountry)
				newLine.push(capId.getCustomID())
				newLine.push(iNumber)
				newLine.push(iAmount)
				newLine.push(iDate)
				newLine.push(parentAltId)
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,PLATE_NUMBER).getOutput()[0].getChecklistComment() )
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,PERMIT_LOCATION).getOutput()[0].getChecklistComment() )
				newLine.push(rType)

				// Add Line to export
				SAP_Export.push(newLine.join(DELIM))
				// Flag record as Invoiced
				updateAppStatus("Invoiced", "Sent to SAP in export " + FILE_NAME, capId)
			}
		}
		catch(errr) {
			logDebug("**ERROR: SAP Interface Skipping " + capId.getCustomID() + ": " + errr)
		}
	}

	var reportFileSent = false;
	if (!processTimeout) {
		exportString = Base64.encode(SAP_Export.join(NEW_LINE))
		thisEnd = 0;
		sendSuccess = true;
		firstPacket = true
		logDebug("Attempting to send file for " + (SAP_Export.length-1) + " records.")
		do {
			thisStart = thisEnd
			thisEnd += (firstPacket) ? 20 : MAX_POST_LEN
			stage = (firstPacket) ? 0 : (thisEnd < exportString.length) ? 1 : 2

			//logDebug("\n\n"+stage + ": "+ exportString.slice(thisStart,thisEnd))
			sendSuccess = sendSuccess && sendDataToWebService(exportString.slice(thisStart,thisEnd), FILE_NAME+FILE_TYPE, stage, SOAP_URL, SOAP_ACTION)
			firstPacket = false
		}
		while ( thisEnd < exportString.length )

		if (sendSuccess){
			logDebug("File successfully sent");
			reportFileSent = true ;
		} else {
			logDebug("Error: File was not properly sent");
			reportFileSent = false ;
		}

		if (showFileData == "Y" || !sendSuccess) {
			logDebug(DEBUG_NEW_LINE+DEBUG_NEW_LINE+"+---------------------------------------------------------------------------------------------------------------+"+DEBUG_NEW_LINE+"| SAP Data"+DEBUG_NEW_LINE+"+---------------------------------------------------------------------------------------------------------------+")
			logDebug(SAP_Export.join(DEBUG_NEW_LINE))
			logDebug(DEBUG_NEW_LINE+DEBUG_NEW_LINE)
		}
		// HERE is where we set status or records IF sendSuccess
		logDebug("Runtime:" + elapsed(startTime))
	}
	else {
		logDebug("Exceeded timeout, please rerun.")
	}

	// Send Email Begin
	if(emailTo && emailTo != ""){
		var tHour24 = "" + ("0"+today.getHours()).slice(-2);
		var tHour12 = (today.getHours() > 12) ? ("0"+(today.getHours()-12)).slice(-2) :  (today.getHours() == 0) ? "12": ("0"+today.getHours()).slice(-2);
		var tDate = "" + ("0"+today.getDate()).slice(-2);
		var tMon = "" + ("0"+(1+today.getMonth())).slice(-2);
		var tYear = "" + today.getFullYear();
		var tAmPm = (today.getHours() > 11) ? "PM" : "AM" ;
		var tMin = "" + ("0"+today.getMinutes()).slice(-2);
		var tSec = "" + ("0"+today.getSeconds()).slice(-2);
		var dateAsMoDayYrTime = tMon + "-" + tDate + "-" + tYear + " " + tHour12 + ":" + tMin + ":" + tSec + " " + tAmPm ;
		var emailFrom = "noreply@nypa.com";
		var emailCc = "";
		var emailSubject = "SAP Invoice scheduled event ";
		var emailBody = " records have been processed.";
		if(processTimeout){
			emailSubject += "did not process successfully on " + dateAsMoDayYrTime;
			emailBody = "SAP Invoice scheduled event exceeded timeout, please rerun.";
		} else {
			if(reportFileSent){
				emailSubject += "processed successfully on " + dateAsMoDayYrTime;
				emailBody = "" + (SAP_Export.length-1) + emailBody + "";
			} else {
				emailSubject += "did not process successfully on " + dateAsMoDayYrTime;
				emailBody = "" + "A failure occurred sending the file. "+PACKET_ERROR+" Please, see system logs.";
			}
		}
		aa.sendMail(emailFrom,emailTo,emailCc,emailSubject,emailBody);
		logDebug("emailFrom: " + emailFrom + " emailTo: " + emailTo + " emailCc: " + emailCc + " emailSubject: " + emailSubject + " emailBody: " + emailBody);
		// Send Email End
	}

}
catch(err) {
	logDebug("**ERROR: Processing SAP Interface Batch: ");
	logDebug(err.stack)
}


/******************************* FUNCTIONS *******************************/
function elapsed(stTime) {
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - stTime) / 1000)
}

function sendDataToWebService(dataString, fileName, stage, dataServiceURL, dataServiceSoapAction) {
	xmlRequest = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">\
<soapenv:Header/>\
<soapenv:Body>\
<tem:uploadFile>\
<tem:username>' + username + '</tem:username>\
<tem:password>' + password +'</tem:password>\
<tem:Filename>' + fileName + '</tem:Filename>\
<tem:FileContents>' + dataString + '</tem:FileContents>\
<tem:stage>' + stage + '</tem:stage>\
</tem:uploadFile>\
</soapenv:Body>\
</soapenv:Envelope>'

	var postresp = aa.util.httpPostToSoapWebService(dataServiceURL, xmlRequest, username, password, dataServiceSoapAction);

	if (postresp.getSuccess()) {
	  var response = postresp.getOutput();
	  logDebug("Response: " + response);
	  return true
	}
	else {
		  aa.debug(aa.getServiceProviderCode() + " : ADMIN", "Error : " + postresp.getErrorMessage());
			logDebug(xmlRequest)
		  logDebug("Error : " + postresp.getErrorMessage());
		  PACKET_ERROR =  postresp.getErrorMessage()
	}
	return false
}
