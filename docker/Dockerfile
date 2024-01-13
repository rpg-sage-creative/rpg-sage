FROM amazonlinux:2023

RUN dnf update
RUN dnf install vim -y
RUN dnf install tar -y
RUN dnf install git -y
RUN dnf install zip -y
RUN dnf install findutils -y

RUN dnf install openssh-server -y
RUN mkdir /var/run/sshd
# this creates the keys so we can ssh into it securely
RUN ssh-keygen -A

RUN useradd -g root ec2-user
RUN groupadd ec2-user

WORKDIR /home/ec2-user

RUN mkdir .ssh
RUN chmod 700 .ssh
# generate these keys and put them in this docker folder prior to run
COPY ./rpg-sage-docker .ssh/rpg-sage-docker
COPY ./rpg-sage-docker.pub .ssh/rpg-sage-docker.pub
COPY ./rpg-sage-docker.pem .ssh/rpg-sage-docker.pem
RUN cat .ssh/rpg-sage-docker.pub > .ssh/authorized_keys
RUN chmod 600 .ssh/authorized_keys
RUN chown ec2-user:ec2-user .ssh
RUN chown ec2-user:ec2-user .ssh/authorized_keys

COPY ./initialize.sh /initialize.sh
# to be run MANUALLY by ec2-user upon first connection

EXPOSE 22
ENTRYPOINT /usr/sbin/sshd && /bin/bash

# docker build -t rpg-sage-docker .
# docker run --name rpg-sage-docker -p 2022:22 -dt rpg-sage-docker
# docker exec -it rpg-sage-docker /bin/bash