# TransliterationApplication
[![Build Status](https://travis-ci.org/DanielPollithy/TransliterationApplication.svg?branch=master)](https://travis-ci.org/DanielPollithy/TransliterationApplication)
[![Build status](https://ci.appveyor.com/api/projects/status/ry2i05ev77omps3h?svg=true)](https://ci.appveyor.com/project/DanielPollithy/transliterationapplication)
[![Documentation Status](https://readthedocs.org/projects/transliterationapplication/badge/?version=latest)](http://transliterationapplication.readthedocs.io/en/latest/?badge=latest)
[![API Status](https://img.shields.io/badge/API-0.1-brightgreen.svg)](https://danielpollithy.github.io/TransliterationApplication/api/)
[![API Status](https://img.shields.io/badge/Test_Coverage--brightgreen.svg)](https://danielpollithy.github.io/TransliterationApplication/coverage/lcov-report/index.html)

**Youtube Video**
[![Application Screencast](https://img.youtube.com/vi/4NRxlxq0TEY/0.jpg)](https://www.youtube.com/watch?v=4NRxlxq0TEY)


# Interesting for users

The first part of the README is dedicated to users who want to work with the application.

## TransliterationApplication - Primary use case

You want to analyze text on pictures, how authors interact (overwrite, annotate, comment) with each others, 
the positional distributions of selected words.

This application enables you to build a graph database for your corpus. With the advantage of a graph database query your
analyzations could become easier (see [Comparison of relationals v.s. graph database in corpus analytics]).

The outline of the project for that I built this application looked like this:
1. Pictures with GPS originated in the metropol region of Rome
2. Install TransliterationApplication on Windows
3. Connect the TransliterationApplication to a Neo4J-Node in the Digital Humanities cloud 
(http://dhvlab.gwi.uni-muenchen.de/index.php/Main_Page)
4. REPEAT 3000 times: 
 4.1 Insert picture
 4.2 Create region (called fragment) on picture (as many as you want)
 4.3 Open the TransliterationEditor for the fragment
 4.4 Add a layer for every author that 'collaborated'
 4.5 Drag rectangles onto the layer, annotate the transliteration, the political opinion, the color, the language...
 The user can add an endless amount of not predefined properties to the rectangles
 4.6 Connect the rectangles according to their interactions (e.g. rectangle R1 overwrites rectangle R2, R3 follows R4, 
 R5 is a positive comment to R3... (endless possibilites)
 4.7 Call the save-button in the TransliterationEditor to store the current state
 4.8 Transmit the fragment with all its layers, nodes and edges into the graph database (-> enables autocomplete functions)
5. Transport the locally stored images into the Digital Humanities Cloud in order to build an online map web app for the corpus
6. Analyze the corpus
 6.1 Commentary relation between text blocks can be realized far easier than with SQL
 6.2 Heatmap analysis costs the same effort as with SQL
 6.3 Quantitative analysis for selected words (how often comes word A after word B)
7. Export the graph data for relational database system (MySQL)

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

