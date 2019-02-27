try {
	function getScriptText(vScriptName){
		vScriptName = vScriptName.toUpperCase();
		var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
		var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
		return emseScript.getScriptText() + "";
	}
	eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
	eval(getScriptText("INCLUDES_CUSTOM"));
	//////////////////////////////////////////////////////////////
	var SOAP_URL = "" + aa.env.getValue("InterfaceAdapterURL");
	var username = "" + aa.env.getValue("AdapterUsername");
	var password = "" + aa.env.getValue("AdapterPassword");
	var showFileData = "" + aa.env.getValue("showFileData");
	// New with email notification - BEGIN
	var emailTo = ((""+aa.env.getValue("emailTo")) == "")  ? "ashwinipradeep.tripuraneni@nypa.gov" : "" + aa.env.getValue("emailTo");
	var envIndicator = ((""+aa.env.getValue("envIndicator")) == "")  ? "SUPPORT" : "" + aa.env.getValue("envIndicator");
	// New with email notification - END
	var SOAP_ACTION = "http://tempuri.org/IService1/uploadFile"
	var today = new Date()
	var startTime = today.getTime();
	var MAX_RECORDS = aa.cap.getCapIDList().getOutput().length
	var MAX_USE_CODES = 10
	var DELIM = "|"
	var NEW_LINE = "\r\n"
	var DEBUG_NEW_LINE = ("" + aa.env.getValue("BatchJobName") == "") ? NEW_LINE : "<br>";
	var PACKET_ERROR = "";
	
	
	var TIMEOUT = ("" + aa.env.getValue("BatchJobName") == "") ? 300 : 60*60
	var FILE_NAME = "AccelaGIS" 	//NYPA requested a static filename
	var FILE_TYPE = ".csv"
	var MAX_POST_LEN = 32768
	
	// New with email notification - BEGIN
	if(envIndicator != "PRODUCTION"){
		FILE_NAME = envIndicator + "_" + FILE_NAME;
	}
	// New with email notification - END

	/*var FILE_NAME = "GIS_"+today.getFullYear() + "-"
	FILE_NAME += ("0"+(1+today.getMonth())).slice(-2) + "-"
	FILE_NAME += ("0"+today.getDate()).slice(-2) + "-"
	FILE_NAME += ("0"+today.getHours()).slice(-2) + "-"
	FILE_NAME += ("0"+today.getMinutes()).slice(-2)*/

	var processTimeout = false

	capList = aa.cap.getByAppType("CANALS","Occupancy","Permit","NA",0,MAX_RECORDS).getOutput()

	HEADER = ["CANAL_DIVISION",
		"CITY_TOWN_VILLAGE",
		"COUNTY",
		"CURRENT_ANNUAL",
		"GPS_START_LAT",
		"GPS_START_LON",
		"PERIODIC_FEE_BASED_ON", //Not used as of 12/19/2016
		"PERMIT_AREA",
		"PERMIT_NAME",
		"PERMIT_NUMBER",
		"PERMIT_PURPOSE",
		"PERMIT_STATUS",
		"PLATE_NO",
		"SECTION"]
	for (uc = 1; uc <= MAX_USE_CODES; uc++) HEADER.push("USE_CODE_"+ uc)
	HEADER.push("USE_TYPE")

	//Custom Filed Mapping
	CANAL_DIVISION = "Canal Division"
	CITY_TOWN_VILLAGE = "Municipality"
	COUNTY = "County"
	CURRENT_ANNUAL = "Annual Fee Amount"
	GPS_START_LAT = "Latitude Start"
	GPS_START_LON = "Longitude Start"
	PERIODIC_FEE_BASED_ON = "Periodic Fee Based On"
	PERMIT_AREA = "Permit Area"
	PLATE_NO = "Plate #"
	SECTION = "Section"
	USE_TYPE = "Use Type"

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

	var GIS_Export = []
	GIS_Export.push(HEADER.join(DELIM))

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
			if (capStatus == "Active" || capStatus == "Collections") {
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,CANAL_DIVISION).getOutput()[0].getChecklistComment() )
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,CITY_TOWN_VILLAGE).getOutput()[0].getChecklistComment() )
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,COUNTY).getOutput()[0].getChecklistComment() )
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,CURRENT_ANNUAL).getOutput()[0].getChecklistComment() )
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,GPS_START_LAT).getOutput()[0].getChecklistComment() )
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,GPS_START_LON).getOutput()[0].getChecklistComment() )
				//newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,PERIODIC_FEE_BASED_ON).getOutput()[0].getChecklistComment() ) //removed 12/19/2016
				newLine.push(null)
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,PERMIT_AREA).getOutput()[0].getChecklistComment() )
				newLine.push(cap.getSpecialText())
				newLine.push(capId.getCustomID())
				newLine.push(aa.cap.getCapWorkDesByPK(capId).getOutput().getDescription() )
				newLine.push(""+cap.getCapStatus())
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,PLATE_NO).getOutput()[0].getChecklistComment() )
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,SECTION).getOutput()[0].getChecklistComment() )

				asitObj = aa.appSpecificTableScript.getAppSpecificTableModel(capId,"USE CODE")
				asit = asitObj.getOutput()
				asitIter = asit.getTableField().iterator()
				for ( uc = 1; uc <= MAX_USE_CODES; uc++){
					if (asitIter.hasNext()) newLine.push(asitIter.next())
					else newLine.push(null)
				}

				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,USE_TYPE).getOutput()[0].getChecklistComment() )

				GIS_Export.push(newLine.join(DELIM))
			}
		}
		catch(errr) {
			aa.debug(aa.getServiceProviderCode() + " : ADMIN", "**ERROR: GIS Interface Skipping " + capId.getCustomID() + ": " + errr);
			aa.print("**ERROR: GIS Interface Skipping " + capId.getCustomID() + ": " + errr)
		}
	}

	var reportFileSent = false;
	if (!processTimeout) {
		exportString = Base64.encode(GIS_Export.join(NEW_LINE))
		thisEnd = 0;
		sendSuccess = true;
		firstPacket = true
		aa.print("Attempting to send file for " + (GIS_Export.length-1) + " records.")
		do {
			thisStart = thisEnd
			thisEnd += (firstPacket) ? 20 : MAX_POST_LEN
			stage = (firstPacket) ? 0 : (thisEnd < exportString.length) ? 1 : 2

			//aa.print("\n\n"+stage + ": "+ exportString.slice(thisStart,thisEnd))
			sendSuccess = sendSuccess && sendDataToWebService(exportString.slice(thisStart,thisEnd), FILE_NAME+FILE_TYPE, stage, SOAP_URL, SOAP_ACTION)
			firstPacket = false
		}
		while ( thisEnd < exportString.length )

		if (sendSuccess){
			aa.print("File successfully sent")
			reportFileSent = true ;
		} 
		else {
			aa.print("Error: File was not properly sent")
			reportFileSent = false;
		}

		if (showFileData == "Y") {
			aa.print(DEBUG_NEW_LINE+DEBUG_NEW_LINE+"+---------------------------------------------------------------------------------------------------------------+"+DEBUG_NEW_LINE+"| GIS Data"+DEBUG_NEW_LINE+"+---------------------------------------------------------------------------------------------------------------+")
			aa.print(GIS_Export.join(DEBUG_NEW_LINE))
			aa.print(DEBUG_NEW_LINE+DEBUG_NEW_LINE)
		}
		aa.print("Runtime:" + elapsed(startTime))
	}
	else {
		aa.print("Exceeded timeout, please rerun.")
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
		var emailSubject = "GIS Interface scheduled event ";
		var emailBody = " records have been processed.";
		if(processTimeout){
			emailSubject += "did not process successfully on " + dateAsMoDayYrTime;
			emailBody = "GIS Interface scheduled event exceeded timeout, please rerun.";
		} else {
			if(reportFileSent){
				emailSubject += "processed successfully on " + dateAsMoDayYrTime;
				emailBody = "" + (GIS_Export.length-1) + emailBody + "";
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
	aa.debug(aa.getServiceProviderCode() + " : ADMIN", "**ERROR: Processing GIS Interface Batch: " + err);
	aa.print("**ERROR: Processing GIS Interface Batch: " + err)
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

	//aa.print("<br>"+xmlRequest +"<br>")
	var postresp = aa.util.httpPostToSoapWebService(dataServiceURL, xmlRequest, username, password, dataServiceSoapAction);

	if (postresp.getSuccess()) {
	  var response = postresp.getOutput();
	  aa.print("Response: " + response);
	  return true
	}
	else {
		  aa.debug(aa.getServiceProviderCode() + " : ADMIN", "Error : " + postresp.getErrorMessage());
		  aa.print("Error : " + postresp.getErrorMessage());
		  PACKET_ERROR =  postresp.getErrorMessage();
	}
	return false
}
