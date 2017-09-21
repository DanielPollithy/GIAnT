Guides
======

Feature overview
----------------

TraApp is designed to work on **win32**, **osx** and **linux**.

It uses the **neo4j database** `<https://neo4j.com>`_ as graph storage which is **free to use** in the community edition.

Modelling your annotation use case happens in a graph environment:
**Think about your data as nodes and edges!**

TraApp comes with an **Editor** which speeds up the annotation process of your images.

.. image:: sources/images/screenshots/feature_overview.png

It features:
 - different node types (with positional information and without)
 - layers which can be interpreted as chronology
 - properties of nodes with auto completion
 - copy'n'paste and standard image editor features

You store all of your images in the so called **Index**.

.. image:: sources/images/screenshots/index.png

Every image has **fragments**: They are based on the same image but store another subgraph.

.. image:: sources/images/screenshots/overview_fragments.png

You can add **comments** to fragments and mark them as **done**.

The **Heatmap Tool** can show you the distribution of the nodes on your annotated images.
You can use the **CYPHER** graph query language to select the input nodes for the heatmap algorithm.

.. image:: sources/images/screenshots/heatmap_overview.png

**Exporting** your data and images is possible.
The data can be exported to **CSV** and **SQL**.

.. image:: sources/images/screenshots/overview_export.png

The **editor's behaviour can be configured** to a certain extend.

.. image:: sources/images/screenshots/overview_settings.png

**Custom behaviour** can be implemented via **javascript**.

.. image:: sources/images/screenshots/overview_custom_js.png

**Data integrity** can be assured by using **data constraints**.

.. image:: sources/images/screenshots/overview_constraints.png

Installation
------------

TraApp needs a database connection to neo4j. This can be local (on your machine) or over the internet.

 1. Install Neo4j: `<https://neo4j.com/docs/operations-manual/current/installation/>`_
 2. Download TraApp for your operating system: `<https://github.com/DanielPollithy/TransliterationApplication/releases>`_
 3. Unzip the downloaded archive and start the **TransliterationApplication**

Login to neo4j
--------------

Once you have started the TraApp you are asked to login to your neo4j database:

.. image:: sources/images/screenshots/login_screen.png

The first box asks for the end point: **bolt://localhost:7687**
 - *bolt://* stands for the protocol which is used for the connection
 - *localhost* stands for the local machine (you could replace this by an IP-address in order to connect to a server)
 - *:7687* is the database port on which the neo4j application is listening on

The second box asks for the username: *default is neo4j*

The third box asks for the password: *default is neo4j*
**The password is not explicitly stored in the application. Therefore you have to enter it on every login.**


Getting started
---------------

Now that you are logged in you are able to use the application.
This guide shows you how to use the application. Don't enter any serious data until you came up with
a scheme for your special purpose!

Uploading an image
..................

Clicking on the index button gets you to a table containing all of your uploaded images.

.. image:: sources/images/screenshots/index_bar.png

At the bottom of the page there is an upload button.

**Attention: You can only upload jpeg files**

.. image:: sources/images/screenshots/upload.png

Once uploaded a line appears in the table:

.. image:: sources/images/screenshots/indexline.png

 - The **ID** is a unique identifier
 - The **Pfad** contains the name of the uploaded image
 - **Erstellungsdatum** is the EXIF creation date which was stored in the JPEG image
 - **Fragmente** is a link to the fragments that belong to the image
 - **Löschen** signifies *deletion*

You can click on the table headers in order to sort the table by specific columns.

Creating a fragment
...................

The same procedure can be repeated for the creation of a fragment.

.. image:: sources/images/screenshots/new_frag.png

A fragment has a name for human identification, you can add a comment, mark the fragment *ready*
open the **Editor** for the fragment and transfer the specific fragment to the neo4j database.

.. image:: sources/images/screenshots/frag_line.png


Transfer to neo4j
.................

In order to transfer your data created within the editor you can

 - use the 'Übertragen' link in the fragment's line
 - or click on the 'Batch add' button in the menu bar

.. image:: sources/images/screenshots/batch_add.png

**The batch add makes use of hash codes.**
That means: Only fragments that have been changed or are not in
the database right now are transferred to neo4j.

Using the editor
----------------

Overview
........

The editor is where your work happens. We implemented some features to improve your productivity.
But first comes the basics.

Layers
......

You start off only with the Background layer. It is not possible to attach any data to this layer (that is why you can't change the
status of the lock icon). The only function it has is the checkbox which switches the visibility of the layer on and off.

Imagine you already have a quite populated layers on top of the image. Sometimes it can be better (less distraction) to hide the
background image for a while.

.. image:: sources/images/screenshots/layers.PNG

To start editing you have to click on the '+'-Button in order to add a new layer. The name of the layer is no changable on purpose. 
The lock will be open on this layer because you are still editing it. If you want to make sure that no errors occur meanwhile you are
editing another layer, feel free to lock it.

The trash icon of course stands for the deletion of the layer. The only sideeffect that can happen here is that gaps in the enumeration
appear. Say we created 3 layers. Deleted the second one. Now only layer "1" and "3" remain. The chronology of course is still there.

If you closed the layers panel by clicking the "x" button in the upper right corner, 
you can get the panel by clicking "View"->"Outline".

Nodes
.....

We call every box which is drawn on a layer a node. The different types of boxes can be configured through the settings.
In general every different entity should have its own node type (box type).

.. image:: sources/images/screenshots/node_types.PNG

By double clicking on one box you can edit the content of it. This might not be necessary for your use-case but is auxiliary if
you want to make your annotations easy readable.

The given box types are divided into to categories:
 - Singular Tokens (positional)
 - Group Tokens


The default setup interprets them as follows: 

The singular tokens contain text or at least a symbole.
  - "Token" is a real textual component (maybe a word)
  - "Modification" is always overlapping a "Token" (maybe a strike-through or an overwriting)
  - "Symbol" is straight-forward a symbole
  
The Group Tokens shall not carry positional information. They are called "Groups".
  - "Comment" is a group of singular tokens that relates over one single entity to another group (Imagine to grafitis on neighbouring walls relating to each others)
  - "Frame" shall carry the psychological framing. The "Frame" Group is special because it connects to MetaGroups. (see next paragraph)
  - "Blanco" is a general purpose group
  
Fictional example for comment groups:
.. image:: sources/images/screenshots/comments.PNG

Properties can be attached to tokens. See section "properties".

Relations
.........

The entities of your image annotations are expressed by tokens.
TranslationApplication becomes handy when these tokens interact with each others or the important information lays in "between" them.
(This is also the case where graph databases can serve with their graph query languages.)

.. image:: sources/images/screenshots/Book.PNG

Different kinds of exemplary relations can be examined:
 - "part of" relations: a word is part of a sentence etc.
 - "follows" relation: a word follows another word
 - "negates" relation: an expression negates the related expression
 - "opens frame" relation: a word or symbole opens a psychological frame
 - ... (lots of possibilites)

Properties can be attached to relations. See section "properties".

Properties
..........

Properties are attaches to relations and tokens. The stored information is transferred directly into the graph database so it can be used for querying your data.

.. image:: sources/images/screenshots/properties.PNG

**Cool Features:**
Every property you have transferred into the neo4j graph database is used to enhance your experience by providing autocompletion:
There is autocomletion on:
 - property names and
 - property values
 
Selecting a new property from the autocompletion. 
.. image:: sources/images/screenshots/property_name.PNG

Selecting a value for the given property from the autocompletion.
.. image:: sources/images/screenshots/property_value.PNG
 
The autocompletion is token type, property and relation type sensitive.

Different tokens need distinct properties. You can configure this with the settings and even give default values and javascript validations. There are a lot of possibilities to model your use-case with this tools.


Data scheme in neo4j
--------------------

Interpretation as a graph
.........................

Advantages of graphs
....................

Using Cypher
............

Heatmap tool
------------

Normalization techniques
........................

Custom queries
..............

Data constraints
----------------

Exporting your data
-------------------

SQL and CSV
...........

Images
......



