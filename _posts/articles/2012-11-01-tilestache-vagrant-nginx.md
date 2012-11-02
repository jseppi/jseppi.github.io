---
layout: article
title: Serving Map Tiles from TileStache with Vagrant, NGINX, and Gunicorn
abstract: How I got it all up and running
author_twitter: hydrologee
author: James Seppi
categories:
- articles
published: true
---

## Host Machine Setup

### 1. On your Linux host machine, install ruby and rubygems.

For Fedora 17:
 
    sudo yum install ruby
    sudo yum install rubygems


For Ubuntu 12.04:

    sudo apt-get install ruby
    sudo apt-get install rubygems
    
### 2. Install VirtualBox

For Fedora 17:

As seen at [http://www.zealfortechnology.com/2012/06/install-oracle-virtualbox-on-fedora.html](http://www.zealfortechnology.com/2012/06/install-oracle-virtualbox-on-fedora.html)
    
    curl http://download.virtualbox.org/virtualbox/rpm/fedora/virtualbox.repo > virtualbox.repo
    sudo mv virtualbox.repo /etc/yum/repos.d/
    sudo yum install dkms
    sudo yum install VirtualBox4.2

### 3. Install and Setup Vagrant

As seen at http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/

    sudo gem install vagrant
    vagrant box add base http://files.vagrantup.com/precise32.box
    vagrant init
    vagrant up

## Guest Vagrant Box Setup



**************

## Sources:
* http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/
* http://www.cleverkoala.com/2011/09/how-to-install-python-imaging-in-a-virtualenv-with-no-site-packages/
* http://virtualenvwrapper.readthedocs.org/en/latest/command_ref.html#toggleglobalsitepackages