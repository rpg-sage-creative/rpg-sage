# rpg-sage
RPG Sage - A TTRPG Play by Discord bot (primarily PF2e)

This code represents the RPG Sage, a Discord Bot designed for Play by Discord usage.
While originally written specific to Pathfinder 2e, the core dialog and dice functionality allow for any TTRPG.

## Dev Setup
To ensure compatibility, use VSCode, Node 18.14.1, and Typescript 4.7.4 (other TS versions break it currently)!
The tasks.json file's build task includes a dependency that creates an index.d.ts for pdf2json ... mind it!

## Installation

Stable (Manage Roles, Manage Channels, Create Instant Invite, Manage Emojis, Manage Webhooks, View Channels, Send Messages, Manage Messages, Embed Links, Attach Files, Read Message History, Use External Emojis, Add Reactions, Slash Commands)
https://discord.com/api/oauth2/authorize?client_id=644942473315090434&permissions=4026920017&scope=bot%20applications.commands

Beta (Manage Roles, Manage Channels, Create Instant Invite, Manage Emojis, Manage Webhooks, View Channels, Send Messages, Manage Messages, Embed Links, Attach Files, Read Message History, Use External Emojis, Add Reactions, Slash Commands)
https://discord.com/api/oauth2/authorize?client_id=545359763203162122&permissions=4026920017&scope=bot%20applications.commands

Dev (Manage Roles, Manage Channels, Create Instant Invite, Manage Emojis, Manage Webhooks, View Channels, Send Messages, Manage Messages, Embed Links, Attach Files, Read Message History, Use External Emojis, Add Reactions, Slash Commands)
https://discord.com/api/oauth2/authorize?client_id=653643416311169044&permissions=4026920017&scope=bot%20applications.commands

## Deploy
zip -r -v -9 deploy dist/* node_modules -x "**/backup/*.zip"

## Usage

View the Complete Command Guide
http://rpgsage.io/index.html

View the Quick Start Guide
http://rpgsage.io/quick.html

## Contributing

## License
