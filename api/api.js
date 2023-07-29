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
function renderListGroupCard(header, items) {
	return renderCard(header, `
		<ul class="list-group">
			${items.map(item => `<li class="list-group-item">${item}</li>`).join("") || "<li class='list-group-item'><i>empty</i></li>"}
		</ul>
	`);
}

function renderUser(user) {
	const cardBody = $(`div#user-tab-pane .card-body`);

	cardBody.append(renderListGroupCard("Meta", [
		`<b>ID</b> ${user.id ?? "<i>none</i>"}`,
		`<b>DID</b> ${user.did ?? "<i>none</i>"}`
	]));

	const aliases = (user.aliases ?? []).sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
	cardBody.append(renderListGroupCard("Aliases", aliases.map(alias => `
		<b>Name</b> <code>${alias.name}</code>
		<br/><b>Target</b> <code>${alias.target.replace(/\n/g, "\\n")}</code>
		<br/><b>Usage</b> <code>${alias.name}::</code>
	`)));

	const macros = (user.macros ?? []).sort((a, b) => !a.category ? -1 : !b.category ? 1 : a.category.toLowerCase() === b.category.toLowerCase() ? a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1 : a.category.toLowerCase() < b.category.toLowerCase() ? -1 : 1);
	cardBody.append(renderListGroupCard("Macros", macros.map(macro => `
		<b>Category</b> ${macro.category ?? "<i>none</i>"}
		<br/><b>Name</b> ${macro.name}
		<br/><b>Dice</b> <code>${macro.dice}</code>
	`)));

	const pcs = (user.playerCharacters ?? []).sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
	cardBody.append(renderListGroupCard("Player Characters (Global)", pcs.map(pc => `
		<b>Name</b> ${pc.name}
		<br/><b>Id</b> ${pc.id}
		<br/><b>User</b> ${pc.userDid}
		<br/><b>Avatar</b> ${pc.avatarUrl}
		<br/><b>Token</b> ${pc.tokenUrl}
		<br/><b>Companions</b> ${(pc.companions ?? []).map(c => c.name).join("") || "<i>none</i>"}
		<br/>${JSON.stringify(pc.companions)}
		<br/><b>Last Messages</b> ${JSON.stringify(pc.lastMessages)}
		<br/><b>Notes</b> ${JSON.stringify(pc.notes)}
		<br/><b>Auto Channels</b> ${JSON.stringify(pc.autoChannels)}
	`)));

	const npcs = (user.nonPlayerCharacters ?? []).sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
	cardBody.append(renderListGroupCard("NonPlayer Characters (Global)", npcs.map(npc => `
		<b>Name</b> ${npc.name}
		<br/><b>Id</b> ${npc.id}
		<br/><b>User</b> ${npc.userDid}
		<br/><b>Avatar</b> ${npc.avatarUrl}
		<br/><b>Token</b> ${npc.tokenUrl}
		<br/><b>Companions</b> ${(npc.companions ?? []).map(c => c.name).join("") || "<i>none</i>"}
		<br/>${JSON.stringify(npc.companions)}
		<br/><b>Last Messages</b> ${JSON.stringify(npc.lastMessages)}
		<br/><b>Notes</b> ${JSON.stringify(npc.notes)}
		<br/><b>Auto Channels</b> ${JSON.stringify(npc.autoChannels)}
	`)));

	cardBody.append(renderListGroupCard("Notes", (user.notes ?? []).map(JSON.stringify)));
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
		console.warn(`Invalid JSON!`, json);
		return;
	}
	renderUser(json.user);
	renderGames(json.games);
	renderMaps(json.maps);
	renderMessages(json.messages);
	renderE20Chars(json.e20Chars);
	renderPb2eChars(json.pb2eChars);
	$("div.alert.alert-info").addClass("d-none");
}

function locationSearchToKeyValuePairs() {
	return (location.search.split("?")[1] ?? "")
		.split("&")
		.map(s => s.split("="))
		.reduce((out, pair) => { out[pair[0]] = pair[1]; return out; }, { });
}

$(async () => {
	const pairs = locationSearchToKeyValuePairs();
	$.post("/", JSON.stringify(pairs)).then(render);
});
