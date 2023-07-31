import type SageInteraction from "../model/SageInteraction";
import type SageMessage from "../model/SageMessage";

async function slashTester(sageInteraction: SageInteraction): Promise<boolean> {
	if (sageInteraction.isCommand("party")) {
		sageInteraction
	}
	return false;
}

async function messageTester(sageMessage: SageMessage): Promise<boolean> {
	return false;
}

// function createPartyRole

// function deletePartyRole

// function addUserToPartyRole

// function removeUserFromPartyRole

async function commandHandler(sageCommand: SageMessage): Promise<void> {
	// check server to see if they have enabled user party/role creation
	// check server to see how many user party/roles each player can create
	// check server to see how many user party/roles each player can be in
}