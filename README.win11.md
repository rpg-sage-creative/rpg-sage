1. open terminal / powershell settings
  - make sure "run this profile as administrator" is toggled on

2. run "Get-ExecutionPolicy"
  - if "Restricted", run "Set-ExecutionPolicy RemoteSigned"

3. install windows subsystem for linux
  - wsl --install
  - wsl.exe --install debian

4. download visual studio code
  - https://code.visualstudio.com/
  - run installer

5. download git msi
  - https://git-scm.com/install/windows
  - run installer
  - select vscode as git editor
  - also best to `git config --global user.name "NAME HERE"`
  - and also to `git config --global user.email "EMAIL@DOMAIN.EXT"`

6. download nodejs msi
  - https://nodejs.org/en/download
  - run installer
  - check "automatically install the neccesary tools"

7. create / navigate to the directory you want to clone the RPG Sage repo into
  - we commonly use `~/git/rsc`

8. if you plan to daemomize RPG Sage locally, run `pm2 -v` to ensure you have "PM2 Process Manager" installed
  - if "pm2" is not installed, run `npm install -g pm2`

9. before cloning from github, check that your ssh key is attached to your account
  - visit `https://github.com/settings/keys`
  - for info on creating ssh keys visit [this github page](`https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent`)

10. clone the RPG Sage repo and attempt first build
  - `git clone git@github.com:rpg-sage-creative/rpg-sage.git`
  - `cd rpg-sage`
  - `npm i`
  - `npm run build`

  BASH IS NOT IN WINDOWS
