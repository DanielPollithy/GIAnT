/* convert a mxgraph xml to a graphml xml file

(1) Drop following attributes

- Graph
    - grid
    - gridSize
    - guides
    - toolTips
    - connect
    - arrows
    - fold
    - page
    - pageScale


(2) Parse the style attribute in order to retrieve the following attributes

 - MxCell
    - tokenType


 -> first: read the saved mxgraph with xml2js into a javscript object
 -> then make the validity checks
    - is the structure of the xml correct
        - mxGraph
            - root
                - cells
                    - geometry

    - are all necessary attributes at hand
        - mxGraphModel
            - dx
            - dy
            - pageWidth
            - pageHeight
        - mxCell
            - id
            - parent
 -> then drop unnecessary attributes
 -> export as GraphML


MAKE SOME TDD Test Driven Development here.


 */

var fs = require('fs');
var xml2js = require('xml2js');

var Codec = Codec || {};

Codec.parser = new xml2js.Parser();

Codec.mxgraph_to_object = function(filename, callback) {
    fs.readFile(__dirname + '/' + filename, function(err, data) {
        if (!err) {
            Codec.parser.parseString(data, function (err, result) {
                var root = result.mxGraphModel.root[0];
                for (var i = 0; i<root.mxCell.length; i++) {
                    var node = root.mxCell[i];
                    if (node.$.parent) {
                        var parent = Codec.get_node_by_id(root, node.$.parent);
                        if (! parent.children) {
                            parent.children = []
                        }
                        parent.children.push(node);
                    }
                }
                callback(err, result);
            });
        } else {
            callback(err);
        }
    });
};

Codec.get_node_by_id = function(root, id) {
    for (var i = 0; i<root.mxCell.length; i++) {
        var node = root.mxCell[i];
        if (node.$.id === id) {
            return node;
        }
    }
};

function clean_restructured_graph(g) {
    //console.log(g);

}

Codec.perform_checks = function(filename) {
    mxgraph_to_object(filename, function(err, result) {
        var temp = null;
        for (var l = 0; l < result.mxGraphModel.root[0].mxCell.length; l++) {
            var node = result.mxGraphModel.root[0].mxCell[l];
            if (node.$.id === "0") {
                temp = node;
            }
        }
        result.mxGraphModel.root[0].mxCell = [temp];
        console.dir(result, {depth: 15});
    });
};

function classify_node(node) {
    // a node without a geometry is either an object, a group or a layer
    return null;
}

//perform_checks("../media/uploaded_xmls/1.xml");

module.exports = Codec;



