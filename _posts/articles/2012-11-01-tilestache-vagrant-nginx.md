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

First we have to get the host Linux machine setup.  This is the machine from which we will run our Vagrant virtual box. If not already there, `cd` to your preferred working directory.

    mkdir ~/Web/VagrantTileStache
    cd ~/Web/VagrantTileStache     

### 1. On your Linux host machine, install ruby and rubygems if you haven't already.

For Fedora 17:
 
    sudo yum install ruby rubygems
    
For Ubuntu 12.04:

    sudo apt-get install ruby rubygems
    
### 2. Install VirtualBox

For Fedora 17:

As seen at [http://www.zealfortechnology.com/2012/06/install-oracle-virtualbox-on-fedora.html](http://www.zealfortechnology.com/2012/06/install-oracle-virtualbox-on-fedora.html).
    
    curl http://download.virtualbox.org/virtualbox/rpm/fedora/virtualbox.repo > virtualbox.repo
    sudo mv virtualbox.repo /etc/yum/repos.d/
    sudo yum install dkms
    sudo yum install VirtualBox4.2

Note: You might also need to `sudo yum install ruby-devel gcc`

For Ubuntu 12.04:
    
    sudo apt-get install virtualbox

or you can download a newer version from [http://www.oracle.com/technetwork/server-storage/virtualbox/downloads/index.html](http://www.oracle.com/technetwork/server-storage/virtualbox/downloads/index.html).

### 3. Install and Setup Vagrant

As seen at [http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/](http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/).

First we install the vagrant gem and download a base vagrant box (the VirtualBox) from which we'll build our virtual machine.  For a list of available boxes, see [http://www.vagrantbox.es/](http://www.vagrantbox.es/).

    sudo gem install vagrant
    vagrant box add precise32 http://files.vagrantup.com/precise32.box
    
The next command will create a "Vagrantfile" in your current working directory, so first `cd` to where you want your installation to go.

    vagrant init precise32

Open the newly created "Vagrantfile" in your preferred text editor and uncomment the line `config.vm.network :hostonly, "192.168.33.10"` (near or at line 23).  You may also specify an address of your choosing instead of the default.

Note: If you'd like to use a bridged network connection, uncomment the `config.vm.network :bridged` line instead (near or at line 28).

See [http://vagrantup.com/v1/docs/config/vm/network.html](http://vagrantup.com/v1/docs/config/vm/network.html) for details on the `config.vm.network` setting.

Now we can start our guest vagrant box:

    vagrant up

Note: The first `vagrant up` might take a few minutes. Be patient!

Other Notes:
* If you need to change some settings in your "Vagrantfile", make sure to do `vagrant reload` 
* The directory where your "Vagrantfile" is stored is a shared drive on your virtual machine!  From your virtual machine it can be accessed at `/vagrant`.

## NGINX and TileStache on the Guest Vagrant Box

Now that we have the host machine setup and running our guest Vagrant virtual machine, we can get to setting up TileStache and NGINX.

### 1. Install all kinds of stuff

First let's get into an ssh session on our vagrant box.

    vagrant ssh

Now we can start the installation fun!

    sudo apt-get update
    sudo apt-get install nginx python-pip python-imaging python-mapnik2 memcached 

Note: memcached is optional, but it makes a nice caching provider for TileStache, so I'd recommend it.

Note 2: python-imaging and python-mapnik2 are installed using `apt-get` to dist-packages because they do not play well with virtualenv.  If anyone knows how to get them to, please let me know!

### 2. Create a virtualenv for your TileStache

We are going to use virtualenvwrapper to manage our python packages for our TileStache instance. virtualenvwrapper allows us to use global python packages along with our virtualenv packages to get around the python-imaging and python-mapnik2 problem.

    sudo pip install virtualenvwrapper
    source /usr/local/bin/virtualenvwrapper.sh
    mkdir TileStacheServer
    mkvirtualenv --no-site-packages TileStacheServer/

You'll now be operating withing a virtualenv, as indicated by the name in parentheses at the start of your terminal prompt, ex `(TileStacheServer) root@precise32:/home/vagrant#`

See [http://blog.sidmitra.com/manage-multiple-projects-better-with-virtuale](http://blog.sidmitra.com/manage-multiple-projects-better-with-virtuale) for a more in-depth overview in setting up and using virtualenvwrapper

To be continued...

**************

## Resources:
* [Vagrant](http://vagrantup.com)
* [VirtualBox](http://virtualbox.org)
* [TileStache](http://www.tilestache.org/)
* [NGINX](http://nginx.org/en/)
* [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/en/latest/command_ref.html)
* [http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/](http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/)
* [http://blog.sidmitra.com/manage-multiple-projects-better-with-virtuale](http://blog.sidmitra.com/manage-multiple-projects-better-with-virtuale)
* 