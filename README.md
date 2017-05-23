# TransliterationApplication
[![Build Status](https://travis-ci.org/DanielPollithy/TransliterationApplication.svg?branch=master)](https://travis-ci.org/DanielPollithy/TransliterationApplication)
[![Build Status](https://readthedocs.org/projects/transliterationapplication/badge/?version=latest)](https://danielpollithy.github.io/TransliterationApplication/api/)
<a href="https://danielpollithy.github.io/TransliterationApplication/coverage/lcov-report/index.html">Code Coverage</a>

# Interesting for users

The first part of the README is dedicated to users who want to work with the application.

## Example workflow

<img src="https://danielpollithy.github.io/TransliterationApplication/images/sota-opt.gif">

## user interface tutorial

insert a link here

## installation instruction

# Interesting for developers

This part is intended to give developers some entry points.

## Architecture

This is a nodejs client server application wrappend into an electron app.
The server is expressjs powered and **currently not suitable for public exposure**.
The server stores data in a neo4j community edition that needs to be installed locally or accessible remotely.

The frontend is a bunch of pug templates rendered by the expressjs server.
The editor is an adaption of the mxgraph draw editor. Explicit changes are marked with 'DANIEL'. A diff-view will be provided.
The custom.js adds necessary custom logic for the autocomplete, backgroundimage and so on.

### Storage process
The editor is called with GET params for
 - image: contains the location of the background image (/media/uploaded_images/something.jpg)
 - image_id: the ID(image) from neo4j
 - xml_file: same for the xml file (/media/uploaded_xmls/1.xml)

The editor calls /save_xml with the POST params
 - filename (xml_file.split('/')[-1] in words the name of the xml file from the GET params)
 - in the body an xml file by name 'xml'

The server overwrites any existing xml with the same name in media/uploaded_xmls/

### mxgraph to neo4j
If the user wants to transport the mxgraph xml to neo4j she or he has to press the 'Übertrag' link

The server.js invokes codec.js
 1. removes the fragment
 2. calls mxgraph_to_neo4j(image_id, fragment_id)

For details how the conversion is done see the technical documentation.

## npm commands

 - ```npm run coverage``` creates ./docs/coverage files
 - ```npm run docs``` creates ./docs/api files for ./src/*.js
 - ```npm run test``` runs all tests from ./test/*.js
 - ```npm run server``` runs the src/server.js
 
## build instructions

In order to build a bundled electron application for a specific operating system
electron-packager is used.

If you are on the OS where you want to ship to just do the following steps:
 - ```npm install``` at least once
 - ```electron-packager . ``` in the base directory of the repo
 - zip the created folder and ship it

The deployment to OS X has never been tried so far.

## Logging

The server logs to the following default locations (electron-log)


    on Linux: ~/.config/<app name>/log.log
    on OS X: ~/Library/Logs/<app name>/log.log
    on Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log

