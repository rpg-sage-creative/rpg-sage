# Use a base image with SSH installed (you can choose a different base image if needed)
FROM amazonlinux:2023

RUN yum update

# in case you need to edit files
RUN yum install -y vim

# some build scripts use "find"
RUN yum install -y findutils

# kind of an important thing
RUN yum install -y git

# Install SSH server
RUN yum install -y openssh-server
RUN ssh-keygen -t rsa -f /etc/ssh/ssh_host_rsa_key

# install node/npm/pnpm and pm2
RUN curl -fsSL https://rpm.nodesource.com/setup_24.x | bash - && yum install -y nodejs
RUN npm install -g pnpm pm2

# ensure rpg-sage folder exists
RUN mkdir /rpg-sage

# ensure base bot folder exists
RUN mkdir -p /rpg-sage/bot/config

# ensure data folder / tree exists
RUN mkdir -p /rpg-sage/data/cache/pdf

RUN mkdir -p /rpg-sage/data/foundry

RUN mkdir -p /rpg-sage/data/pf2e/dist

RUN mkdir -p /rpg-sage/data/sage/bots
RUN mkdir -p /rpg-sage/data/sage/characters
RUN mkdir -p /rpg-sage/data/sage/dice
RUN mkdir -p /rpg-sage/data/sage/e20
RUN mkdir -p /rpg-sage/data/sage/games
RUN mkdir -p /rpg-sage/data/sage/heph
RUN mkdir -p /rpg-sage/data/sage/maps
RUN mkdir -p /rpg-sage/data/sage/messages/2026
RUN mkdir -p /rpg-sage/data/sage/pb2e
RUN mkdir -p /rpg-sage/data/sage/servers
RUN mkdir -p /rpg-sage/data/sage/users

RUN mkdir -p /rpg-sage/data/slash

# Add ec2-user
RUN adduser ec2-user
RUN usermod -aG wheel ec2-user

# make ec2-user owner of /rpg-sage so that pm2 deploy can function
RUN chown -R ec2-user /rpg-sage

# SSH port (optional, change if needed)
EXPOSE 22

# Start SSH service
CMD ["/usr/sbin/sshd", "-D"]