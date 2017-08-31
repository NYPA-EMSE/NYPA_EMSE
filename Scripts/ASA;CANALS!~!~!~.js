
showdebug = true;
var conArray = getContactArray();
var conNbr = "";

for (con in conArray)
{
	debugObject(conArray[con]);
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