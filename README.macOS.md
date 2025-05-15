# Dev Setup (macOS)

For transparency, and to ensure compatibility, the following versions are used:
- NVM 0.40.3, NPM 11.3.0, Node 22.15.0, and Typescript 5.8.3; VSCode for development

The tasks.json file's build task includes a dependency that creates an index.d.ts for pdf2json ... mind it!

# From Scratch

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
  - as of this guide, the version is `nvm install 22`

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

11. start your bot with `npm run start-dev`
  - if you are using vscode you should be able to use the hot key for "test"
  - the first time you run it will create your bot's json file from the bot.template.json file
