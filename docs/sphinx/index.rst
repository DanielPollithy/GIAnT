.. GIAnT documentation master file, created by
   sphinx-quickstart on Wed May 31 15:08:02 2017.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

GIAnT - Graphical Image Annotation Tool
=======================================

.. image:: sources/images/logo.png

GIAnT is an open source cross platform desktop application designed
to aid scientists with graphical image annotation in the process of creating a corpus.

If you have a set of images, want to make annotations or even analyze how utters interact with each
other  this application might be useful for your project.

We built it for the analyzing grafitis in Rome. Never the less the application is designed to be adapted for other studies.

.. raw:: html

    <iframe width="560" height="315" src="https://www.youtube.com/embed/4NRxlxq0TEY" frameborder="0" allowfullscreen></iframe>

This documentation is divided into three sections:
 1. Guides: An overview of the features for non-users and explanations to get you started
 2. Articles explaining the main features and advantages
 3. Documentations: A Technical documentation which enables programmers to extend this application

(There is an **API description** available here:
`<https://danielpollithy.github.io/GIAnT/api/>`_ )

Contents
--------

.. toctree::
   :maxdepth: 2

   Guides
   Articles
   Documentations


Articles
========

The following article list will give you a good insight in all the knowledge about this application.

It is going to cover

 - "Basic data flow description"
 - "How mxGraph was modded",
 - "Codec.js - mxGraph XML -> GraphML -> Neo4J",
 - "The express.js server",
 - "Pug templates",
 - "Data storage XML and images",
 - "Exif data extraction",
 - "Electron application",
 - "How to build the electron application cross platform",
 - "Why Electron"
 - "Could the server be used as a standalone?",
 - "How does the autocomplete function work",
 - "Asynchronous tests with mocha.js and chai.js"
 - "About the code coverage"
 - "Extending the mxGraph Editor"
 - "What is not implemented"
 - "Next steps"

Maybe
 - "App performance struggle: Million of nodes, thousands of images and a lot of properties"
 - "Codec.js - What is the biggest XML-Graph it can convert to Neo4J?"
 - "A question of complexity: Cypher vs SQL for transliteration analyzes"
 - "The use case of this application"

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

