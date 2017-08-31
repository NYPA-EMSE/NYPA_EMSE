
var conArray = getContactArray();
var conNbr = "";

for (con in conArray)
{
	if (conArray[con].contactType == "Billing")
	{
		conNbr = conArray[con].contactSeqNumber;
		if (!matches(conNbr, undefined, "", null))
		{
			contactSetPrimary(conNbr);
		}
	}
}