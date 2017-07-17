/**************************************************************************************************************
*	ID-17 - Update Occupancy Amendment Record ID
*	Mike Linscheid
*/
try {
	parentId = getParent()
	if (parentId) {
		parentAltId = parentId.getCustomID()
		//logDebug("Parent Id: " +parentAltId)
		childList = getChildren("CANALS/Occupancy/Amendment/NA", parentId)
		newChildren = []
		mostRecentSuffix = 0
		for ( c in childList ) {
			childAltId = childList[c].getCustomID()
			if ( childAltId.indexOf(parentAltId) == 0 ){
				altIdArr = (childAltId.replace(parentAltId,"")).split("-")
				//get 1st sequence number
				thisSuffix = parseInt(altIdArr[altIdArr.length -1])
				//logDebug(altIdArr.join("|") + " suffix: " + thisSuffix)
				mostRecentSuffix = (thisSuffix > mostRecentSuffix) ? thisSuffix : mostRecentSuffix
			}
			else{
				newChildren.push(childList[c])
			}
		}
		logDebug("Last suffix: " +mostRecentSuffix)
		
		for (n in newChildren) {
			mostRecentSuffix++
			newAltId = parentAltId + "-R-" + ("000"+mostRecentSuffix).slice(-3)
			updateResult = aa.cap.updateCapAltID(newChildren[n], newAltId)
			if (!updateResult.getSuccess()) {
				logDebug("***ERROR changing the altId to: " + newAltId + ": " + updateResult.getErrorMessage())
			}
			else {
				logDebug("Successfully changed the altId from: " + newChildren[n].getCustomID() + " to: " + newAltId)
			}
		}
	}
}
catch (err) {
	logDebug("A JavaScript Error occurred: ASA:CANALS/Occupancy/Amendment/NA: #17: " + err.message);
	logDebug(err.stack)
}		


