#!/bin/bash

# run dnf updates/installs
# these may be needed in aws, but are loaded by the dockerfile
# dnf update
# dnf install vim -y
# dnf install tar -y
# dnf install git -y
# dnf install findutils -y

touch ~/.bash_profile

# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# initialize nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# install node / npm
nvm install 18.15.0
nvm install-latest-npm

# install typescript
npm install -g typescript@5.1.6

# install npm
npm install -g pm2
pm2 install pm2-logrotate

mkdir -p /home/ec2-user/legacy/data
mkdir -p /home/ec2-user/legacy/deploy

# run this
# ssh-keygen -t ed25519 -C "randal.t.meyer@gmail.com"
# then add /home/ec2-user/.ssh/id_ed25519.pub as a github key
# cd ~/legacy
# git clone git@github.com:randaltmeyer/rpg-sage-legacy.git dev
# rm -rf ./node_modules/pdf2json/index.d.ts
# echo 'declare module "pdf2json";' > ./node_modules/pdf2json/index.d.ts
# tsc --build tsconfig.json