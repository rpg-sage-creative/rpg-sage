# rpg-sage

RPG Sage - A TTRPG Play by Discord bot (primarily PF2e)

This code represents the RPG Sage, a Discord Bot designed for Play by Discord usage.
While originally written specific to Pathfinder 2e, the core dialog and dice functionality allow for any TTRPG.

## Dev Setup

For transparency, and to ensure compatibility, the following versions are used:
- The Dev Lab: NVM 0.39.7, Node 18.20.2, and Typescript 5.4.5; VSCode for development
- The Server: NVM 0.39.7, Node 18.15.0, and Typescript 5.1.6

The tasks.json file's build task includes a dependency that creates an index.d.ts for pdf2json ... mind it!

### MacOS from scratch

1. run `git -v` to ensure you have "git" installed
  - if "git" is not installed, it should open Xcode's installer to install git
  - if not, you may need to run `xcode-select --install`
  - also best to `git config --global user.name "NAME HERE"`
  - and also to `git config --global user.email "EMAIL@DOMAIN.EXT"`
2. ensure you have a bash/terminal profile setup
  - if not, you may simply run `echo '' > ~/.zshrc`
3. run `nvm -v` to ensure you have "Node Version Manager" installed
  - if "nvm" is not installed, get the latest install url from `https://github.com/nvm-sh/nvm`
  - as of this guide, the latest is `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`
4. run `nvm ls` to ensure you have the version of Node used by RPG Sage
  - as of this guide, the version is `nvm install 18`
5. run `npm -v` to ensure you have "Node Package Manager" installed
  - if "npm" is not installed, run `nvm install-latest-npm`
6. navigate to the directory you want to clone the RPG Sage repo into
  - we commonly use `~/git/rsc`
7. if you plan to daemomize RPG Sage locally, run `pm2 -v` to ensure you have "PM2 Process Manager" installed
  - if "pm2" is not installed, run `npm install -g pm2`
8. before cloning from github, check that your ssh key is attached to your account
  - visit `https://github.com/settings/keys`
  - for info on creatign ssh keys visit [this github page](`https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent`)
9. clone the RPG Sage repo and attempt first build
  - `git clone git@github.com:rpg-sage-creative/rpg-sage.git`
  - `cd rpg-sage`
  - `npm i`
  - `npm run build`
10. create your config/env.json file
  - copy/paste `env.template.json` as `env.json`
  - put your bot's Discord token in the "botToken"
  - replace all the zeroed out ids with the correct and valid ids for your bot and environment (as needed)
  - as of this guide: rollemId was `240732567744151553`
  - as of this guide: tupperBoxId was `431544605209788416`
11. start your bot with `npm run start-dev`
  - if you are using vscode you should be able to use the hot key for "test"
  - the first time you run it will create your bot's json file from the bot.template.json file

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
