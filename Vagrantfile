# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

    config.vm.box = "bento/ubuntu-16.04"
    config.vm.network "private_network", ip: "192.168.33.75"
    config.vm.hostname = "pearlcare-poc"
    #config.vm.network "forwarded_port", guest: 4200, host: 4200
    config.vm.synced_folder ".", "/var/www", :mount_options => ["dmode=777", "fmode=666"]

    config.vm.provision :shell, :path => "provision.sh"

    #pecl channel-update pecl.php.net Optional NFS. Make sure to remove other synced_folder line too
    #config.vm.synced_folder ".", "/var/www", :nfs => { :mount_options => ["dmode=777","fmode=666"] }

end
