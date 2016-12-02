function getUserEmailsByTitle(searchTitle) {
	searchTitle = (""+searchTitle).toUpperCase()
	emailList = []
	try {
		userListObj = aa.people.getSysUserList(null)
		if (userListObj.getSuccess()) {
			userList = userListObj.getOutput()
			for (u in userList) {
				thisUserEmail = ""+userList[u].getEmail()
				if ( ((""+userList[u].getTitle()).toUpperCase()).indexOf(searchTitle) >= 0 && thisUserEmail != "null") emailList.push(thisUserEmail)
			}
			return emailList
		}
		else {
			logDebug()
			return []
		}
	}
	
	catch (err) {
		logDebug("A JavaScript Error occurred: getUserEmailsByTitle(): " + err.message);
		logDebug(err.stack)
	}
	return emailList
}