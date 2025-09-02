FROM kalilinux/kali-rolling:latest

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash \
       ca-certificates \
       curl \
       dnsutils \
       git \
       iputils-ping \
       nmap \
       gobuster \
       nuclei \
       enum4linux-ng \
       ldap-utils \
       sublist3r \
       netexec \
       dirb \
       python3 \
       python3-pip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY NEXA.sh /app/NEXA.sh
COPY NEXA-logo.png /app/NEXA-logo.png

RUN chmod +x /app/NEXA.sh

# Default output directory inside container will persistable via bind mount
VOLUME ["/app/output"]

# Helpful labels
LABEL maintainer="" \
      description="NEXA - Network Enumeration & eXposure Analyzer"

# Usage:
# docker build -t nexa .
# docker run --rm -it --net=host -v $(pwd)/outputs:/app/output nexa

ENTRYPOINT ["/app/NEXA.sh"]

