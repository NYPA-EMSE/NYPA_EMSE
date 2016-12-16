try {
	var SOAP_URL = "http://springdelivery3721.cloudapp.net/gis1/Service1.svc/soap"
	var SOAP_URL = "" + aa.env.getValue("InterfaceAdapterURL");
	var username = "" + aa.env.getValue("AdapterUsername");
	var password = "" + aa.env.getValue("AdapterPassword");
	var SOAP_ACTION = "http://tempuri.org/IService1/uploadFile"
	var today = new Date()
	var startTime = today.getTime();
	var MAX_RECORDS = aa.cap.getCapIDList().getOutput().length
	var MAX_USE_CODES = 10
	var DELIM = "|"
	var NEW_LINE = (aa.env.getValue("BatchJobName") == "") ? "\r\n" : "<br>"
	
	var TIMEOUT = 59*60
	var FILE_TYPE = ".csv"
	var MAX_POST_LEN = 64000
	
	
	

	/*var FILE_NAME = "GIS_"+today.getFullYear() + "-"
	FILE_NAME += ("0"+(1+today.getMonth())).slice(-2) + "-" 
	FILE_NAME += ("0"+today.getDate()).slice(-2) + "-" 
	FILE_NAME += ("0"+today.getHours()).slice(-2) + "-" 
	FILE_NAME += ("0"+today.getMinutes()).slice(-2)*/
	
	//NYPA requested a static filename
	FILE_NAME = "AccelaGIS"
	
	var processTimeout = false
	
	capList = aa.cap.getByAppType("CANALS","Occupancy","Permit","NA",0,MAX_RECORDS).getOutput()

	HEADER = ["CANAL_DIVISION",
		"CITY_TOWN_VILLAGE",
		"COUNTY",
		"CURRENT_ANNUAL",
		"GPS_START_LAT",
		"GPS_START_LON",
		"PERIODIC_FEE_BASED_ON",
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

	var GIS_Export = []
	GIS_Export.push(HEADER.join(DELIM))

	for (i in capList) {
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
				newLine.push(aa.appSpecificInfo.getAppSpecificInfos(capId,PERIODIC_FEE_BASED_ON).getOutput()[0].getChecklistComment() )
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
	
	
	if (!processTimeout) {
		exportString = GIS_Export.join(NEW_LINE);
		thisEnd = 0;
		sendSuccess = true;
		aa.print("Attempting to send file with " + exportString.length + " lines.")
		do {
			thisStart = thisEnd
			thisEnd += MAX_POST_LEN
			stage = (thisStart == 0) ? 0 : (thisEnd < exportString.length) ? 1 : 2
			
			//aa.print("\n\n"+(thisEnd < exportString.length) + ": "+ exportString.slice(thisStart,thisEnd))
			sendSuccess = sendSuccess || sendDataToWebService(exportString.slice(thisStart,thisEnd), FILE_NAME+FILE_TYPE, stage, SOAP_URL, SOAP_ACTION)
		}
		while ( thisEnd < exportString.length )
		
		if (sendSuccess) aa.print("File successfully sent")
		else aa.print("Error: File was not properly sent")
		aa.print("Runtime:" + elapsed(startTime))
	}
	else {
		aa.print("Exceeded timeout, please rerun.")
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

	var postresp = aa.util.httpPostToSoapWebService(dataServiceURL, xmlRequest, "", "", dataServiceSoapAction);

	if (postresp.getSuccess()) {
	  var response = postresp.getOutput();
	  aa.print("Response: " + response); 
	  return true
	}
	else {
		  aa.debug(aa.getServiceProviderCode() + " : ADMIN", "Error : " + postresp.getErrorMessage());
		  aa.print("Error : " + postresp.getErrorMessage());
	}
	return false
}

