Developing a Codec: Test driven development
-------------------------------------------

The heard of this program is the codec which can create a graph in neo4j from a mxGraph input file.

An example for a mxGraph:

.. code-block:: none

    <mxGraphModel dx="811" dy="514" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="806" pageHeight="566" background="#ffffff">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" style="locked=1;" parent="0"/>
        <mxCell id="2" value="Hand 1" parent="0"/>
        <object label="Token" color="ros" dialect="no" lang="ital" pos="NPR" them_mak="ult" tool="spr" id="4">
        <mxCell style="tokenType=token;rounded=1;whiteSpace=wrap;fillColor=#FFFFFF;opacity=50;html=1;" parent="2" vertex="1">
            <mxGeometry x="180" y="10" width="120" height="60" as="geometry"/>
        </mxCell>
        </object>
      </root>
    </mxGraphModel>

The GraphML format
..................

The coded can also transform the arbitrary mxGraph format to the open GraphML standard,
which looks like this:

.. code-block:: none

    <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <graphml>
      <key id="label" for="node" attr.name="label" attr.type="string"/>
      <key id="color" for="node" attr.name="color" attr.type="string"/>
      <key id="dialect" for="node" attr.name="dialect" attr.type="string"/>
      <key id="lang" for="node" attr.name="lang" attr.type="string"/>
      <key id="pos" for="node" attr.name="pos" attr.type="string"/>
      <key id="them_mak" for="node" attr.name="them_mak" attr.type="string"/>
      <key id="tool" for="node" attr.name="tool" attr.type="string"/>
      <key id="id" for="node" attr.name="id" attr.type="string"/>
      <key id="parent" for="node" attr.name="parent" attr.type="string"/>
      <key id="vertex" for="node" attr.name="vertex" attr.type="string"/>
      <key id="hand" for="node" attr.name="hand" attr.type="string"/>
      <key id="x" for="node" attr.name="x" attr.type="string"/>
      <key id="y" for="node" attr.name="y" attr.type="string"/>
      <key id="width" for="node" attr.name="width" attr.type="string"/>
      <key id="height" for="node" attr.name="height" attr.type="string"/>
      <key id="as" for="node" attr.name="as" attr.type="string"/>
      <key id="tokenType" for="node" attr.name="tokenType" attr.type="string"/>
      <key id="rounded" for="node" attr.name="rounded" attr.type="string"/>
      <key id="whiteSpace" for="node" attr.name="whiteSpace" attr.type="string"/>
      <key id="fillColor" for="node" attr.name="fillColor" attr.type="string"/>
      <key id="opacity" for="node" attr.name="opacity" attr.type="string"/>
      <key id="html" for="node" attr.name="html" attr.type="string"/>
      <graph id="G" edgedefault="directed">
        <node id="4">
        <data key="label">Token</data>
        <data key="color">ros</data>
        <data key="dialect">no</data>
        <data key="lang">ital</data>
        <data key="pos">NPR</data>
        <data key="them_mak">ult</data>
        <data key="tool">spr</data>
        <data key="id">4</data>
        <data key="parent">2</data>
        <data key="vertex">1</data>
        <data key="hand">Hand 1</data>
        <data key="x">180</data>
        <data key="y">10</data>
        <data key="width">120</data>
        <data key="height">60</data>
        <data key="as">geometry</data>
        <data key="tokenType">token</data>
        <data key="rounded">1</data>
        <data key="whiteSpace">wrap</data>
        <data key="fillColor">#FFFFFF</data>
        <data key="opacity">50</data>
        <data key="html">1</data>
        </node>
      </graph>
    </graphml>

How can we verify that the codec works as wanted?
.................................................

Verification is always difficult. Because the codec is a input-output program without sideeffects
testing can be seen as an appropriate way.

In order to make sure that the tests make sense and the coverage is high Test Driven Development (TDD)
was employed.

What is the biggest XML file it can transform
.............................................

The codec is not optimized to work on big files but a few thousand elements with even more attributes are
possible. Increasing the performance of the codec can be achieved easily.

Batch-add (+checksum)
.....................

By clicking on the "Batch-add"-Button all fragments are checked whether they have changed or not.
Only if they have changed they are updated in the database.
A SHA1 hash from the file original mxGraph XML file is stored every time one of these files is
transferred to the database.

