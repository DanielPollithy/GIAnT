Deployment
==========

Deployment automation
---------------------

Since this project needs to be build on multiple platforms it is a good idea to not just run tests automated
but also use **TRAVIS-CI** and **AppVeyor** to build and deploy the application.
The configuration files can be found in the root directory of the repository.

Travis is used for linux 32bit and 64bit builds and AppVeyor for both architectures for windows (called win32).
See Deployment-Travis or Deployment-AppVeyor for configuration and documentation.

 - `Deployment on Travis-CI`_


Trigger an automatic build
..........................

A build shall only be triggered on tag push. This is how to do this:
 - Tag the commit in Git by :code:`git tag -a v0.0.0 -m "Release 0.0.0"`
 - Push the tag :code:`git push origin v0.0.0`

Now the build triggers automatically the deployment to github releases.
After some minutes there is a new release on the GitHub-Page with the zipped applications attached.

How to Deploy manually
----------------------

If you made a change to the code and want to ship this change in an electron app
follow this procedure

 - Tag the commit in Git by :code:`git tag -a v0.0.0 -m "Release 0.0.0"`
 - Push the tag :code:`git push origin v0.0.0`
 - Package the electron app for your platform with :code:`electron-packager`
 - If you haven't done so, install :code:`electron-packager` globally:  :code:`npm install -g electron-packager`
 - If you are on the OS that you want to target with the build execute :code:`electron-packager`
   (consulate the documentation of electron-packager)
 - Compress the created folder. Example for linux: :code:`zip -r [archive-name].zip [name of the folder]`
 - Navigate to the releases tab of the github repository
 - Edit your release: Add the compressed archive.
 - Add the release to the download section of the documentation
 - Describe the changes made in the CHANGELIST of the documentation


Deployment on Travis-CI
-----------------------

This is an explanation of the configuration and how the workflow works.
If you know Travis-CI this will be boring.

What is Travis-CI
.................

It is a CI (continuous integration) provider that is free to use for public git repositories.
It provides virtual machines that can automatize jobs for you, e.g. run your unit tests or test your code with various
code versions and a lot more.

Setup Travis-CI
...............

It is easily setup if you have a github account.
You can use the github account as a single sign on for Travis-CI.org.
There you activate the wanted repository in the overview.

After you set that up, every time you push to the master branch Travis will start to work for you.

What does Travis do?
....................

He (look at the logo) will pull our code and look for a configuration file called :code:`.travis.yml`.
This file contains all the things we want Travis to do for us.

In our case this is:
 - downloading and installing the latest neo4j-community server
 - install all other dependencies
 - run the tests
 - build the electron application and package it
 - deploy the package to github releases (if the release doesn't exist so far, he will create one)

Detailed description of the Configuration
.........................................

In Line 22 there is the installation script for neo4j triggered. This will only work on unix systems.

In Line 40 you see there is a BASH variable. If you want to use this deploy configuration
you have to go to github.com, login into your account, from there create an access token with the
option "repo" ticked and copy paste the generated token into the environment variables in the TRAVIS
web frontend. **Don't forget to activate encryption for this variable** or else everyone can access
your with ease.

.. code-block:: yaml
    :linenos:
    :emphasize-lines: 22, 40

    osx_image: xcode7.3
    sudo: required
    dist: trusty
    language: c
    matrix:
      include:
      - os: osx
      - os: linux
        env: CC=clang CXX=clang++ npm_config_clang=1
        compiler: clang
    cache:
      directories:
      - node_modules
      - "$HOME/.electron"
      - "$HOME/.cache"
    addons:
      apt:
        packages:
        - libgnome-keyring-dev
        - icnsutils
    before_install:
    - ./install_neo4j.sh
    - mkdir -p /tmp/git-lfs && curl -L https://github.com/github/git-lfs/releases/download/v1.2.1/git-lfs-$([
      "$TRAVIS_OS_NAME" == "linux" ] && echo "linux" || echo "darwin")-amd64-1.2.1.tar.gz
      | tar -xz -C /tmp/git-lfs --strip-components 1 && /tmp/git-lfs/git-lfs pull
    - if [[ "$TRAVIS_OS_NAME" == "linux" ]]; then sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils; fi
    install:
    - nvm install 6
    - npm install electron-builder@next
    - npm install
    - npm prune
    script:
    - npm run release
    branches:
      except:
      - "/^v\\d+\\.\\d+\\.\\d+$/"

    deploy:
      provider: releases
      api_key: "$GH_TOKEN"
      file_glob: true
      file: "*.zip"
      skip_cleanup: true
      on:
        tags: false



Deployment on AppVeyor
----------------------

AppVeyor provides a similar service to Travis-CI but is focused on windows.
So they provide a **Power shell** on a win32 host system you can configure.

You have to put a :code:`appveyor.yml` file into the base dir of the repo which
might look like this.

This configuration excludes the test because we already ran the tests on travis
and at the moment you are going to have a hard time installing neo4j into their machines.

.. code-block:: yaml
    :linenos:
    :emphasize-lines: 22, 40

    version: 0.1.{build}

    platform:
      - x86
      - x64

    cache:
      - node_modules
      - app\node_modules
      - '%APPDATA%\npm-cache'
      - '%USERPROFILE%\.electron'

    init:
      - git config --global core.autocrlf input

    install:
      - ps: Install-Product node 6 x64
      - git reset --hard HEAD
      - npm install npm -g
      - npm install electron-builder@next # force install next version to test electron-builder
      - npm install
      - npm prune

    build_script:
      - node --version
      - npm --version
      - npm run release

    test: off

    deploy:
      release: GIAnT-v$(appveyor_build_version)
      description: 'GIAnT'
      provider: GitHub
      auth_token:
        secure: QBn6bw8znM2WsrG32eTzA55Iu0iE6oymujVBos6XFUldN/biNahd6Csr6d9Y4u+E
      artifact: '**\*.zip'            # upload all NuGet packages to release assets
      draft: true
      prerelease: true
      on:
        branch: master                 # release from master branch only