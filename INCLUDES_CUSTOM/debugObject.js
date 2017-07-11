function debugObject(object)
{
	var output = ''; 
	for (property in object) 
	{ 
		output += "<font color=red>" + property + "</font>" + ': ' + "<bold>" + object[property] + "</bold>" +'; ' + "<BR>"; 
	} 
	logDebug(output);
}