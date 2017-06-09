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

All images are normalized to the output size. 
The tokens are scaled accordingly.

Thw final result ist the distribution of tokena over the images.

Normalization 2: Position in scritte (bounding box)
...................................................

This method fetches the **Bounding Box** of every image and scales
the tokens according to it.

The bounding box ist the rectangle spanned by the lowest coordinate
to the highest one.

The result shows the distribution of tokens within the bounding box.

Normalization 3: Bounding box centered
--------------------------------------

Here the bounding box is placed into the normalised image.
But the position is changed: The box's center is placed over the normalisation target center.

As a result, the bounding boxes and by that way the outlines of all scritte are comparable.

