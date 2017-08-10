Heatmap
=======

The heatmap tool can be used to analyze the positions of tokens.
It might be interesting to see the density of tokens in a region or the outline they form.

The input for this tool has to be a Cypher query. It will then only work with the tokens,
therefore it is recommended to build your query to only return tokens.

The query is not analyzed or guarded. This means that any code can be executed.
As a consequence must this feature kept on a local system and not exposed through a webserver!

The color scheme of the heatmap reaches from 0 (yellow) to 1 (red).

Normalization techniques
------------------------

In this context the term normalization refers to an algorithm that makes the positions
of tokens in different images comparable.

So far there are two types of normalizations present:

Normalization 1: Position in image
..................................

Das Bezugssystem ist hier

Normalization 2: Position in scritte (bounding box)
...................................................

...

