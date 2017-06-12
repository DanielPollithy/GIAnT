Graph Elements
==============

The editor is configured in a manner so you can make use of Tokens, Symbols and Modifications on the
smallest layer. All of them carry the label "Token".

A group of Tokens can be organized in Groups: Comments, Frames and Blanco-Groups.
Groups themselves can have relations in between in order to model comment flows.
A special thing about them is that they don't have positional information.
Their label is "Group".

The 'Frame' group is connected to a 'meta frame' with the same name. Its label is 'MetaGroup'.
If a MetaGroup with the given name (for example 'Extreme left') did not exist so far
it will be created by Database.add_node(...)
This behaviour was explicitly requested by Sebastian to interconnect the subgraphs.

The layer to which a Token belongs to won't be reflected as a node in the graph but as a property for every
element because the layer doesn't carry any further information or property.

