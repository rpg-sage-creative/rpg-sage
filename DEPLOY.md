# Steps to Deploy

Ensure no existing tmp dir
<br>
`rm -rf /home/ec2-user/legacy/dev-tmp`

Clone repo into tmp dir
<br>
`git clone -b BRANCH_NAME --single-branch git@github.com:randaltmeyer/rpg-sage-legacy.git /home/ec2-user/legacy/dev-tmp`

Choose tmp dir
<br>
`cd /home/ec2-user/legacy/dev-tmp`

Load node modules
<br>
`npm ci`

Make sure pdf2json has index.d.ts
<br>
`[ ! -f "./node_modules/pdf2json/index.d.ts" ] && echo 'declare module "pdf2json";' > ./node_modules/pdf2json/index.d.ts`

Build repo
<br>
`npm run build`

Delete bot from pm2
<br>
`pm2 desc sage-dev-aws >/dev/null && pm2 delete sage-dev-aws`

Delete maps from pm2
<br>
`pm2 desc sage-maps-aws >/dev/null && pm2 delete sage-maps-aws`

Choose root dir
<br>
`cd /home/ec2-user/legacy`

Rename existing dir
<br>
`mv /home/ec2-user/legacy/dev /home/ec2-user/legacy/dev-2024-01-01-1234`

Rename tmp dir
<br/>
`mv /home/ec2-user/legacy/dev-tmp /home/ec2-user/legacy/dev`

Choose bot dir
<br>
`cd /home/ec2-user/legacy`

Start bot in pm2
<br>
`pm2 start bot.mjs --name sage-bot-dev --max-memory-restart 750M --node-args='--experimental-modules --es-module-specifier-resolution=node' -- dev`

Start maps in pm2
<br>
`pm2 start map.mjs --name sage-bot-dev --max-memory-restart 500M --node-args='--experimental-modules --es-module-specifier-resolution=node' -- dev`

Update pm2
<br>
`pm2 save`

### pm2 config usage
`pm2 start pm2.config.cjs --env dev`
`pm2 start pm2.config.cjs --env beta --only sage-bot`
`pm2 start pm2.config.cjs --env stable`

# Get a Single Branch
`git clone -b v1.6.0 --single-branch git@github.com:randaltmeyer/rpg-sage-legacy.git rpg-sage-legacy-v1.6.0`