# rpg-sage

RPG Sage - A TTRPG Play by Discord bot (primarily PF2e)

This code represents the RPG Sage, a Discord Bot designed for Play by Discord usage.
While originally written specific to Pathfinder 2e, the core dialog and dice functionality allow for any TTRPG.

## Dev Setup

For transparency, and to ensure compatibility, the following versions are used:
- The Dev Lab: NVM 0.40.3, NPM 11.6.1, Node 24.9.0, and Typescript 5.9.3; VSCodium for development
- The Server: NVM 0.39.7, NPM 11.6.0, Node 24.9.0, and Typescript 5.9.3

The tasks.json file's build task includes a dependency that creates an index.d.ts for pdf2json ... mind it!

[Dev Setup (debian)](<./README.debian.md>)
[Dev Setup (macOS)](<./README.macOS.md>)

## Discord Bot Permissions and Scope

RPG Sage requires:
> Manage Roles, Manage Channels, Create Instant Invite, Manage Emojis, Manage Webhooks, View Channels, Send Messages, Manage Messages, Embed Links, Attach Files, Read Message History, Use External Emojis, Add Reactions, Slash Commands

The following is the authorize url for RPG Sage (Stable):
```
https://discord.com/api/oauth2/authorize?client_id=644942473315090434&permissions=4026920017&scope=bot%20applications.commands
```

## Deploy

@todo update this

## Usage

View the Complete Command Guide
http://rpgsage.io/index.html

View the Quick Start Guide
http://rpgsage.io/quick.html

## Contributing

@todo update this

## License

Copyright (C) 2024 RPG Sage Creative

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
