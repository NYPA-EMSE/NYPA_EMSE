try {
	var startTime = new Date().getTime();
	var MAX_RECORDS = 999999//aa.cap.getCapIDList().getOutput().length
	var MAX_USE_CODES = 10
	var DELIM = "|"
	var NEW_LINE = "<br>" //"\r\n"
	var TIMEOUT = 60*60
	
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
			
			GIS_Export.push(newLine.join(DELIM))
		}
		catch(errr) {
			aa.debug(aa.getServiceProviderCode() + " : ADMIN", "**ERROR: GIS Interface Skipping " + capId.getCustomID() + ": " + errr);
			aa.print("**ERROR: GIS Interface Skipping " + capId.getCustomID() + ": " + errr)
		}

		if (i >= 200 ) break

	}
	if (!processTimeout) {
		aa.print(GIS_Export.join(NEW_LINE))
		aa.print("Runtime:" + elapsed(startTime))
	}
	else {
		aa.print("Exceeded timeout...")
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
