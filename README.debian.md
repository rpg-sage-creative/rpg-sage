# Dev Setup (Debian GNU Linux 12.6 ARM64)

For transparency, and to ensure compatibility, the following versions are used:
- The Dev Lab: NVM 0.39.7, Node 18.20.2, and Typescript 5.4.5; VSCode for development
- The Server: NVM 0.39.7, Node 18.15.0, and Typescript 5.1.6

The tasks.json file's build task includes a dependency that creates an index.d.ts for pdf2json ... mind it!

# From Scratch

1. a few of these commands will likely need things up to date
  - check for the latest packages `sudo apt update`
  - you may want to also run `sudo apt upgrade` (especially on a clean install)

2. run `git -v` to ensure you have "git" installed
  - if not, install with `sudo apt install git -y`
  - also best to `git config --global user.name "NAME HERE"`
  - and also to `git config --global user.email "EMAIL@DOMAIN.EXT"`

3. run `nvm -v` to ensure you have "Node Version Manager" installed
  - if "nvm" is not installed, get the latest install url from `https://github.com/nvm-sh/nvm`
  - if you haven't installed these yet, they are required: `sudo apt install build-essential libssl-dev curl`
  - as of this guide, the latest is `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash`

4. run `nvm ls` to ensure you have the version of Node used by RPG Sage
  - as of this guide, the version is `nvm install 18`

5. run `npm -v` to ensure you have "Node Package Manager" installed
  - if "npm" is not installed, run `nvm install-latest-npm`

6. create / navigate to the directory you want to clone the RPG Sage repo into
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
  - for a simple editor you can use `vim config/env.json` but you might have to install it with `sudo apt install vim`

11. start your bot with `npm run start-dev`
  - if you are using vscode you should be able to use the hot key for "test"
  - the first time you run it will create your bot's json file from the bot.template.json file
