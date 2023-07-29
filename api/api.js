//#region render helpers

function keysToListGroup(object) {
	const items = Object
		.keys(object)
		.map(key => `<b>${key}:</b> ${JSON.stringify(object[key])}`);
	const liItems = items
		.map(item => typeof(item) === "string" ? item : JSON.stringify(item))
		.map(item => `<li class="list-group-item">${item}</li>`);
	return `<ul class="list-group">${liItems.join("")}</ul>`;
}

function renderCard(header, body) {
	return `<div class="card">
		<div class="card-header">${header}</div>
		<div class="card-body">${body}</div>
	</div>`;
}

function itemsToListGroup(items) {
	const listItems = items.map(item => `<li class="list-group-item">${item}</li>`);
	if (!listItems.length) {
		listItems.push(`<li class="list-group-item"><i>empty</i></li>`);
	}
	return `<ul class="list-group">${listItems.join("")}</ul>`;
}

function renderListGroupCard(header, items) {
	return renderCard(header, `<ul class="list-group">${itemsToListGroup(items)}</ul>`);
}

function renderListGroupAccordionItem(accId, title, items, show) {
	const id = title.replace(/\W+/g, "-").toLowerCase();
	return `
		<div class="accordion-item">
			<h2 class="accordion-header">
				<button class="accordion-button ${show ? ``:  `collapsed`}" type="button" data-bs-toggle="collapse" data-bs-target="#${id}" aria-expanded="${!!show}" aria-controls="${id}">
					${title}
				</button>
			</h2>
			<div id="${id}" class="accordion-collapse collapse ${show ? `show`:  `collapsed`}" data-bs-parent="#${accId}">
				<div class="accordion-body">
					${itemsToListGroup(items)}
				</div>
			</div>
		</div>
	`;
}

//#endregion

//https://discord.com/channels/480488957889609733/680954802003378218/1134250552075759626

function renderUserCharacterMessage({ timestamp, serverDid, channelDid, messageDid }) {
	const url = `https://discord.com/channels/${serverDid}/${channelDid}/${messageDid}`;
	const a = `<a href="${url}">[link]</a>`;
	const date = new Date(timestamp);
	return `<li>${date} ${a}</li>`;
}
function renderUserCharacterMessages(messages) {
	return messages?.length ? `<ul>${messages.map(renderUserCharacterMessage).join("")}</ul>` : ``;
}

function renderUserCharacter(char) {
	return `
		<img class="float-end character avatar" src="${char.avatarUrl}" />
		<img class="float-end character token" src="${char.tokenUrl}" />
		<b>Name</b> ${char.name}
		<br/><b>Id</b> ${char.id}
		<br/><b>User</b> ${char.userDid}
		<!--<br/><b>Avatar</b> ${char.avatarUrl}-->
		<!--<br/><b>Token</b> ${char.tokenUrl}-->
		<br/><b>Companions</b> ${(char.companions ?? []).map(c => c.name).join("") || "<i>none</i>"}
		<br/>${JSON.stringify(char.companions)}
		<br/><b>Last Messages</b> ${renderUserCharacterMessages(char.lastMessages)}
		<br/><b>Notes</b> ${JSON.stringify(char.notes)}
		<br/><b>Auto Channels</b> ${JSON.stringify(char.autoChannels)}
	`;
}

function renderUser(user) {
	const cardBody = $(`div#user-tab-pane .card-body`);
	cardBody.append(`<div class="accordion" id="user-accordion"/>`);

	const accordion = cardBody.find("div.accordion");

	accordion.append(renderListGroupAccordionItem("user-accordion", "Meta", [
		`<b>ID</b> ${user.id ?? "<i>none</i>"}`,
		`<b>DID</b> ${user.did ?? "<i>none</i>"}`
	], true));

	const aliases = (user.aliases ?? []).sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
	accordion.append(renderListGroupAccordionItem("user-accordion", "Aliases", aliases.map(alias => `
		<b>Name</b> <code>${alias.name}</code>
		<br/><b>Target</b> <code>${alias.target.replace(/\n/g, "\\n")}</code>
		<br/><b>Usage</b> <code>${alias.name}::</code>
	`)));

	const macros = (user.macros ?? []).sort((a, b) => !a.category ? -1 : !b.category ? 1 : a.category.toLowerCase() === b.category.toLowerCase() ? a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1 : a.category.toLowerCase() < b.category.toLowerCase() ? -1 : 1);
	accordion.append(renderListGroupAccordionItem("user-accordion", "Macros", macros.map(macro => `
		<b>Category</b> ${macro.category ?? "<i>none</i>"}
		<br/><b>Name</b> ${macro.name}
		<br/><b>Dice</b> <code>${macro.dice}</code>
	`)));

	const pcs = (user.playerCharacters ?? []).sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
	accordion.append(renderListGroupAccordionItem("user-accordion", "Player Characters (Global)", pcs.map(renderUserCharacter)));

	const npcs = (user.nonPlayerCharacters ?? []).sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
	accordion.append(renderListGroupAccordionItem("user-accordion", "NonPlayer Characters (Global)", npcs.map(renderUserCharacter)));

	accordion.append(renderListGroupAccordionItem("user-accordion", "Notes", (user.notes ?? []).map(JSON.stringify)));
}
function renderGames(games) {
	$(`div#games-tab-pane .card-body`).html(keysToListGroup(games));
}
function renderMaps(maps) {
	$(`div#maps-tab-pane .card-body`).html(keysToListGroup(maps));
}
function renderMessages(messages) {
	$(`div#messages-tab-pane .card-body`).html(keysToListGroup(messages));
}
function renderE20Chars(e20Chars) {
	$(`div#e20Chars-tab-pane .card-body`).html(keysToListGroup(e20Chars));
}
function renderPb2eChars(pb2eChars) {
	$(`div#pb2eChars-tab-pane .card-body`).html(keysToListGroup(pb2eChars));
}
function render(json) {
	if (!json?.uuid && !json?.did && !json?.user) {
		console.warn(json);
		$("div.alert.alert-info")
			.removeClass("alert-info")
			.addClass("alert-danger")
			.html("Invalid JSON!");
		return;
	}
	renderUser(json.user);
	renderGames(json.games);
	renderMaps(json.maps);
	renderMessages(json.messages);
	renderE20Chars(json.e20Chars);
	renderPb2eChars(json.pb2eChars);
	$("div.alert.alert-info").addClass("d-none");
	$("div.container.content").removeClass("d-none");
}

function locationSearchToKeyValuePairs() {
	return (location.search.split("?")[1] ?? "")
		.split("&")
		.map(s => s.split("="))
		.reduce((out, pair) => { out[pair[0]] = pair[1]; return out; }, { });
}

$(async () => {
	const pairs = locationSearchToKeyValuePairs();
	if (pairs.id || pairs.uuid || pairs.did) {
		$.post("/", JSON.stringify(pairs)).then(render);
	}else {
		$("div.alert.alert-info")
			.removeClass("alert-info")
			.addClass("alert-warning")
			.html("Missing Identifier!");
	}
});
