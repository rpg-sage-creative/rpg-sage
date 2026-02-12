# Steps to Deploy

Ensure no existing tmp dir
<br>
`rm -rf /home/ec2-user/legacy/dev-tmp`

Clone repo into tmp dir
<br>
`git clone -b BRANCH_NAME --single-branch git@github.com:rpg-sage-creative/rpg-sage.git /home/ec2-user/legacy/dev-tmp`

Choose tmp dir
<br>
`cd /home/ec2-user/legacy/dev-tmp`

Load node modules
<br>
`pnpm install`

Build repo
<br>
`pnpm build`

Delete bot from pm2
<br>
`pm2 desc sage-bot-dev >/dev/null && pm2 delete sage-bot-dev`

Delete maps from pm2
<br>
`pm2 desc sage-map-stable >/dev/null && pm2 delete sage-map-stable`

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
`cd /home/ec2-user/legacy/dev`

Start apps in pm2
<br>
`pm2 start bot.config.cjs --env dev --only sage-bot`
<br>
`pm2 start bot.config.cjs --env beta --only sage-bot`
<br>
`pm2 start bot.config.cjs --env stable`

Update pm2
<br>
`pm2 save`

# Get a Single Branch
`git clone -b release/vX.Y.Z --single-branch git@github.com:rpg-sage-creative/rpg-sage.git rpg-sage-vX.Y.Z`