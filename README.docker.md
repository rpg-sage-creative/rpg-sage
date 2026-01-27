# RPG Sage local Docker

Assumptions:
1 - you are using `./docker-volumes` for RPG Sage's data
2 - you have a `./config/deploy-bot-docker.json` based on deploy.template.json
3 - you have `.ssh` keys setup for connecting to RPG Sage's github repos
4 - you have `.npmrc` setup for connecting to RPG Sage's github repos
5 - you aren't using port 2222 (container's ssh port 22 is mapped to it)

This document is currently just a convenience for reminding myself how to use the Dockerfile and docker-compose.yml files to test pm2 deployments locally.

Hopefully, this will be cleaned up and formalized so that others can read it easier.

## Basic Deployment to Docker Container

### Quick Refresh of Container

The following is a quick way to remove a running container and delete the image before starting a fresh build.

```
docker compose down; docker image remove rpg-sage-mono; docker compose up -d
```

### Quick pre-ssh

Your first connection to the container via ssh will likely ask for approval to add 127.0.0.1 to `~/.ssh/known_hosts`.
This approval request often breaks when run by pm2.
It is therefore a good idea to connect to your container via ssh before running a deployment.

```
ssh -i '~/.ssh/rpg-sage-stable.pem' -p 2222 ec2-user@127.0.0.1
```

### Deployment Setup

PM2 has a "setup" step that prepares the destination deployment folder.

```
pm2 deploy bot.config.cjs docker setup
```

### Deployment

This step pushes latest commit for the branch to the target.

```
pm2 deploy bot.config.cjs docker
```

If you have unchecked changes locally, regardless of what branch is being deployed, you might need to force it.

```
pm2 deploy bot.config.cjs docker --force
```

### Restart After Reboot

Amazon Linux 2023 seems to have issues with PM2 startup.
If that is the case, the following should be run after connecting via ssh as ec2-user.

```
pm2 resurrect
```