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

## Before You Start

You're going to need a valid Mapnik XML file and some spatial data to serve as tiles.  I suggest using [TileMill](http://mapbox.com/tilemill/) to style your data and export the Mapnik XML.  Note that if you use TileMill, you'll have to edit the exported Mapnik XML so that the paths to the shapefiles are correct for the TileStache server we create here. You should also delete the &lt;Parameters&gt; section of your Mapnik XML because some earlier versions of Mapnik will error out if they encounter it.

If you just want to get setup with a simple example, you can use [this zip file](/files/ts_countries.zip) I created.

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
    sudo mv virtualbox.repo /etc/yum.repos.d/
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

Now create and `cd` to the directory you want to hold your Vagrant box.  I'll put it in a folder called VagrantStache in my home directory.

    mkdir ~/VagrantStache
    cd ~/VagrantStache
    
The next command will create a "Vagrantfile" in your current working directory
    
    vagrant init precise32

Open the newly created "Vagrantfile" in your preferred text editor and uncomment the line `config.vm.network :hostonly, "192.168.33.10"` (near or at line 23).  You may also specify an address of your choosing instead of the default.

Note: If you'd like to use a bridged network connection, uncomment the `config.vm.network :bridged` line instead (near or at line 28).

See [http://vagrantup.com/v1/docs/config/vm/network.html](http://vagrantup.com/v1/docs/config/vm/network.html) for details on the `config.vm.network` setting.

Now we can start our guest vagrant box:

    vagrant up

Note: The first `vagrant up` might take a few minutes. Be patient!

Other Notes:
* If you need to change some settings in your "Vagrantfile", make sure to do `vagrant reload` 
* The directory where your "Vagrantfile" is mounted as a shared folder on your virtual Vagrant machine!  From your virtual machine it can be accessed at `/vagrant`.

If you are using my [example files](/files/ts_countries.zip), `mv` that archive into the Vagrantfile directory so you can access them on your virtual machine.

    mv ~/Downloads/ts_countries.zip ~/VagrantStache/

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

We are going to use virtualenvwrapper to manage our python packages for our TileStache instance. Among other sweet features, virtualenvwrapper allows us to use global python packages along with our virtualenv packages to get around the python-imaging and python-mapnik2 problem.

    sudo pip install virtualenvwrapper
    source /usr/local/bin/virtualenvwrapper.sh
    mkdir TileStacheServer
    mkvirtualenv --no-site-packages TileStacheServer

You'll now be operating withing a virtualenv, as indicated by the name in parentheses at the start of your terminal prompt, ex `(TileStacheServer) vagrant@precise32:/home/vagrant#`

Note: Exit the current virtualenv by typing `deactivate`.  Resume the virtualenv by typing `workon TileStacheServer`.

If you are using my [example files](/files/ts_countries.zip), move and unzip those files into the new directory.

    mv /vagrant/ts_countries.zip TileStacheServer/
    sudo apt-get install unzip
    cd TileStacheServer/
    unzip ts_countries.zip

See [http://blog.sidmitra.com/manage-multiple-projects-better-with-virtuale](http://blog.sidmitra.com/manage-multiple-projects-better-with-virtuale) for a more in-depth overview in setting up and using virtualenvwrapper

### 3. Install python packages

Now we can install the python packages we need to run TileStache

    pip install tilestache modestmaps gunicorn python-memcached

Note: python-memcached is only necessary if you want to use memcached as a cache provider for TileStache.

And we also need to use virtualenvwrapper to toggle global site packages so we have access to PIL and Mapnik2

    toggleglobalsitepackages    

### 4. Configure and Start NGINX with TileStache

Almost there!  We just need to configure NGINX and proxy requests to TileStache.

As seen at [http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/](http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/):

    /etc/init.d/nginx start
    rm /etc/nginx/sites-enabled/default
    touch /etc/nginx/sites-available/TileStache
    ln -s /etc/nginx/sites-available/TileStache  /etc/nginx/sites-enabled/TileStache

Then open `/etc/nginx/sites-enabled/TileStache` with your preferred text editor and add

    server {
        location / {
            proxy_pass http://127.0.0.1:9001;
        }
    }

Restart nginx

    /etc/init.d/nginx restart

And run TileStache using gunicorn, making sure to specify your TileStache config file.  If you are using my example files and have unzipped them into `~/TileStacheServer/` it will look like this:

    gunicorn -b 0.0.0.0:9001 "TileStache:WSGITileServer('/home/vagrant/TileStacheServer/tilestache.cfg')"

### 5. Test it out from your Host Machine

Back on your host machine, navigate your web browser to the address you specified in your Vagrantfile back in step 3 (http://192.168.33.10/). You should see a message confirming TileStache is running:

    TileStache bellows hello.

If you are using my example files, navigate your browser to http://192.168.33.10/countries/ and you should see an interactive map. The tiles themselves are accessible through URLs of the form http://192.168.33.10/countries/{z}/{x}/{y}.png (example: http://192.168.33.10/countries/0/0/0.png)

Hooray!

## Resources:
* [Vagrant](http://vagrantup.com)
* [TileStache](http://www.tilestache.org/)
* [NGINX](http://nginx.org/en/)
* [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/en/latest/command_ref.html)
* [http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/](http://samrat.me/blog/2012/05/flask-nginx-gunicornon-a-vagrant-box/)
* [http://blog.sidmitra.com/manage-multiple-projects-better-with-virtuale](http://blog.sidmitra.com/manage-multiple-projects-better-with-virtuale)