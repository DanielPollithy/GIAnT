# GIAnT
[![Build Status](https://travis-ci.org/DanielPollithy/GIAnT.svg?branch=master)](https://travis-ci.org/DanielPollithy/GIAnT)
[![Build status](https://ci.appveyor.com/api/projects/status/yvbe57nt8kvpt2e9?svg=true)](https://ci.appveyor.com/project/DanielPollithy/giant)
[![Documentation Status](https://readthedocs.org/projects/transliterationapplication/badge/?version=latest)](http://transliterationapplication.readthedocs.io/en/latest/?badge=latest)
[![API Status](https://img.shields.io/badge/API-0.1-brightgreen.svg)](https://danielpollithy.github.io/GIAnT/api/)
[![API Status](https://img.shields.io/badge/Test_Coverage--brightgreen.svg)](https://danielpollithy.github.io/GIAnT/coverage/lcov-report/index.html)
[![Coverage Status](https://coveralls.io/repos/github/DanielPollithy/TransliterationApplication/badge.svg?branch=master)](https://coveralls.io/github/DanielPollithy/TransliterationApplication?branch=master)

## Network
[![Network](https://img.shields.io/badge/QDA_networked_with-openQDA-blue.svg)](https://github.com/barichello/openQDA)

**Youtube Video**

[![Application Screencast](https://img.youtube.com/vi/4NRxlxq0TEY/0.jpg)](https://www.youtube.com/watch?v=4NRxlxq0TEY)


GIAnT - Graphical Image Annotation Tool
=======================================

.. image:: sources/images/logo.png

GIAnT is an open source cross platform desktop application designed
to aid scientists with graphical image annotation in the process of creating a corpus.

If you have a set of images, want to make annotations or even analyze how utters interact with each
other  this application might be useful for your project.

We built it for analyzing graffiti in Rome. Never the less the application is designed to be adapted for other studies.

GIAnT resources
---------------

<table>
<colgroup>
<col width="25%" />
<col width="74%" />
</colgroup>
<thead>
<tr class="header">
<th>What</th>
<th>Where</th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td>Download GIAnT</td>
<td><a href="https://github.com/DanielPollithy/GIAnT/releases" class="uri">https://github.com/DanielPollithy/GIAnT/releases</a></td>
</tr>
<tr class="even">
<td>Report a problem</td>
<td><a href="https://github.com/DanielPollithy/GIAnT/issues" class="uri">https://github.com/DanielPollithy/GIAnT/issues</a></td>
</tr>
<tr class="odd">
<td>Get the code</td>
<td><a href="https://github.com/DanielPollithy/GIAnT" class="uri">https://github.com/DanielPollithy/GIAnT</a></td>
</tr>
<tr class="even">
<td>Check the API</td>
<td><a href="https://github.com/DanielPollithy/GIAnT/" class="uri">https://github.com/DanielPollithy/GIAnT/</a></td>
</tr>
<tr class="odd">
<td>Automatic win32 tests</td>
<td><a href="https://ci.appveyor.com/project/DanielPollithy/giant" class="uri">https://ci.appveyor.com/project/DanielPollithy/giant</a></td>
</tr>
<tr class="even">
<td>Automatic unix tests</td>
<td><a href="https://travis-ci.org/DanielPollithy/GIAnT" class="uri">https://travis-ci.org/DanielPollithy/GIAnT</a></td>
</tr>
<tr class="odd">
<td>Code coverage report</td>
<td><a href="https://coveralls.io/github/DanielPollithy/TransliterationApplication" class="uri">https://coveralls.io/github/DanielPollithy/TransliterationApplication</a></td>
</tr>
<tr class="even">
<td>Licenses</td>
<td><a href="https://github.com/DanielPollithy/GIAnT/blob/master/LICENSES.txt" class="uri">https://github.com/DanielPollithy/GIAnT/blob/master/LICENSES.txt</a></td>
</tr>
</tbody>
</table>



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

