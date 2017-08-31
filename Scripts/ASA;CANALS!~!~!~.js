
showdebug = true;
var conArray = getContactArray();
debugObject(conArray);

var conNbr = "";

for (con in conArray)
{
	if (conArray[con].contactType == "Billing")
	{
		conNbr = conArray[con].contactSeqNumber;
		logDebug("Contact number: " + conNbr);
		if (matches(conNbr, undefined, "", null))
		{
			contactSetPrimary(conNbr);
		}
	}
}