Constraints
===========

In database context 'check constraints' are a mean to assure data integrity.

This application could have varying use cases. From case to case the constraints for the graph
scheme differ.

One use case might restrict the number of edges between nodes. Another one the total amount of nodes
and so on.

As a result this application does not contain a set of 'hard coded' constraints but a configuration
file that contains Cypher queries which will be executed every time a graph was inserted into
Neo4j.

The workflow
------------

GraphEditor -> codec.js -> Neo4j -> constraints.js

Opposite to usual RDMS Neo4j only comes with a limited set of data integrity constraints.
Usually these constraints are checked before inserting data into the database.

This workflow does not do so because we want the user to be able to write Cypher query code.
In a future version it could be possible that a failing constraint triggers the transaction
to be rolled back. So far this doesn't happen.

Design of the constraints
-------------------------

In the end the constraints have to validate so their output is boolean.

If all constraints are true -> then the constraint checking succeeded and there is no error

Else: We hand the error to the user.


Writing constraints
-------------------

There is an entry in the menu which is called 'Constraints'.
In that view you can create two types of constraints:
 - count constraints: You write a query and provide a minimum and/or maximum of accepted results to your query
 - free constraints: you write javascript code (in detail a Promise: see below for an example)

Example for count constraint
............................

You provide a query like :code:`MATCH (a:Token)-[]-(i:Image) RETURN DISTINCT a;`
and the boundaries (lower is contained, upper exluded): [0, 200[

Example for a free constraint
.............................

<any javascript code returning a promise>

Security
--------

The cypher queries are checked to not contain "CREATE", "MERGE", "SET" or any other operation
that could change the data while performing the check. If that happens only a message is prompted
to the user.

These operations could be in the query willingly so they will still get executed in order to
enhance the power of the user on the data.
