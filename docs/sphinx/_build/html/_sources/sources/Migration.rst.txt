Migration
=========

If you want to take your data to another computer follow these steps.

1. Move static files
--------------------

The folder containing the application contains a folder called 'media'.
Compress this folder (e.g. zip it), transport the archive to the new computer
and uncompress it into the new 'media' folder.

This folder contains settings files, the graph editor's xmls and the images.

2. Relocate the Neo4j database
------------------------------

We have to move the Neo4j database to the new computer. There are two options:
 - 2/a: has not worked in the tests but is recommended by Neo4j -> dump'n'load
 - 2/b: has worked but is a little dangerous -> copy'n'paste

2/a Dump and load Neo4j
.......................

According to https://neo4j.com/docs/operations-manual/current/tools/dump-load/

 - stop neo4j
 - neo4j-admin dump --database=<database> --to=<destination-path>
 - neo4j-admin load --from=<archive-path> --database=<database> [--force]
 - start neo4j

Example for unix:

On machine 1
 - sudo service neo4j stop
 - neo4j-admin dump --to=dump.db
 - sudo service neo4j start

On machine 2
 - sudo service neo4j stop
 - neo4j-admin load --from=dump.db --force
 - sudo service neo4j start

Use the 'force' option to overwrite existing data

2/b Second variant for neo4j
............................

If this doesn't work it is possible to copy the whole database directory to the new computer.
By default the database is called graph.db and is situated under /var/lib/neo4j/data/database/graph.db/.
Move the whole folder to your new computer and :code:`service neo4j start`

Example workflow:
 - sudo service neo4j stop
 - zip -r ~/Desktop/dump.zip /var/lib/neo4j/data/databases/graph.db/
 - sudo unzip dump.zip -d /
 - service neo4j start