/* convert a mxgraph xml to a graphml xml file

1. Load XML
2. Add all nodes as children to the layers (unpack the <mxCell> from the <object> tag)
    the <object> tag is used to wrap an mxCell with its attributes
3. Remove groups
4. Edges (There will be no edge without token -> drop layer information)
    - edges don't work inter groups, but they can be intra groups
        -> they have to be unwrapped as well
5. Flatten the hierarchical tree
    - merge mxCells with their layers to obtain the layer-attributes
6. Collect all possible attributes

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
                - cell
                    - geometry
                - object
                    - cell
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
 -> export as GraphML (http://graphml.graphdrawing.org/primer/graphml-primer.html)


MAKE SOME TDD Test Driven Development here.


 */

var fs = require('fs');
var xml2js = require('xml2js');
var database = require('./database');

var Codec = Codec || {};

Codec.parser = new xml2js.Parser();

Codec.builder = new xml2js.Builder({'attrkey':'@', 'charkey': '#'});

Codec.mxgraph_to_object = function(filename, callback) {
    fs.readFile(__dirname + '/' + filename, function(err, data) {
        if (!err) {
            Codec.parser.parseString(data, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    var root = result.mxGraphModel.root[0];

                    // unwrap the <object>s
                    // The objects under root (<object>)
                    if (root.object) {
                        for (var j = 0; j<root.object.length; j++) {
                            var node2 = root.object[j].mxCell[0];
                            if (node2.$.parent) {
                                // merge the object and the node into a new one
                                var merged = {};
                                Object.assign(merged, root.object[j].mxCell[0], root.object[j]);
                                Object.assign(merged.$, root.object[j].mxCell[0].$);
                                delete merged.mxCell;
                                if (!root.mxCell) {
                                    root.mxCell = [];
                                }
                                root.mxCell.push(merged);
                            }
                        }

                        delete root.object;
                    }

                    // remove groups
                    // rewire the children to the parent of the group
                    for (var i=0; i<root.mxCell.length; i++) {
                        var node = root.mxCell[i];
                        if (node.$.style && node.$.style === "group") {
                            var parent = Codec.get_node_by_id(root, node.$.parent);
                            var children = Codec.get_nodes_by_parent_id(root, node.$.id);
                            for (var j=0; j<children.length; j++) {
                                children[j].$.parent = parent.$.id;
                            }
                            root.mxCell[i] = 'x';
                        }
                    }

                    // remove all TO DELETE entries
                    root.mxCell = root.mxCell.filter(function(cell) {
                        return (cell !== 'x')
                    });

                    // The cells in the root (<mxCell>)
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
                }

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

Codec.get_nodes_by_parent_id = function(root, parent_id) {
    var nodes = [];
    for (var i = 0; i<root.mxCell.length; i++) {
        var node = root.mxCell[i];
        if (node.$ && node.$.parent === parent_id) {
            nodes.push(node);
        }
    }
    return nodes;
};

function clean_restructured_graph(g) {
    //console.log(g);

}

Codec.mxgraph_to_layered_object = function(filename, callback) {
    Codec.mxgraph_to_object(filename, function(err, result) {
        if (err) {
            callback(err);
        } else {
            var temp;
            for (var l = 0; l < result.mxGraphModel.root[0].mxCell.length; l++) {
                var node = result.mxGraphModel.root[0].mxCell[l];
                if (node.$.id === "0") {
                    temp = node;
                }
            }
            result.mxGraphModel.root[0].mxCell = [temp];
            delete result.mxGraphModel.root[0].object;
            callback(err, result);
        }
    });
};

Codec.mxgraph_to_flattened_object = function(filename, callback) {
    Codec.mxgraph_to_layered_object(filename, function (err, graph) {
        if (err) {
            callback(err)
        } else {
            graph.mxGraphModel.data = graph.mxGraphModel.root[0].mxCell[0].children;

            // remove the locked background layer which is the first element
            graph.mxGraphModel.data.shift();

            // so far there is only the 'value' attribute which is interesting for the children
            // -> therefore we don't choose a general approach and only copy it to the children

            var only_children = [];

            graph.mxGraphModel.data.forEach(function(layer){
                layer.children.forEach(function(child){
                    child.$.hand = layer.$.value;
                    if (child.hasOwnProperty('mxGeometry')) {
                        Object.assign(child.$, child.mxGeometry[0].$);
                    }
                    only_children.push(child);
                });
            });

            graph.mxGraphModel.data = only_children;
            delete graph.mxGraphModel.root;
            callback(err, graph);
        }
    })
};

Codec.mxgraph_to_graphml = function(filename, callback) {
    Codec.mxgraph_to_flattened_object(filename, function (err, graph) {
        if (err) {
            callback(err)
        } else {

            var graphml = JSON.parse(JSON.stringify(graph));
            graphml.graphml = graphml.mxGraphModel;
            delete graphml.mxGraphModel;
            //graphml.graphml.xmlns = "http://graphml.graphdrawing.org/xmlns";
            //graphml.graphml['xmlns:xsi'] = "http://www.w3.org/2001/XMLSchema-instance";
            //graphml.graphml['xsi:schemaLocation'] = "http://graphml.graphdrawing.org/xmlns\nhttp://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd";

            var keys = {
                'edge': {},
                'node': {}
            };

            graphml.graphml.data.forEach(function(cell){
                var for_ = "node";
                if (cell.$.edge) {
                    for_ = "edge";
                }

                if (cell.$.style) {
                    // split style
                    var styles = cell.$.style.split(';').filter(function(a){return (a.length > 0)})
                    styles.forEach(function(style) {
                        var splits = style.split('=');
                        var key = splits[0];
                        var value = splits[1];
                        if (! cell.$.hasOwnProperty(key)) {
                            cell.$[key] = value;
                        }
                    });
                    delete cell.$.style;
                }

                for (var k in cell.$){
                    if (cell.$.hasOwnProperty(k)) {
                        var key = k;
                        var value = cell.$[k];
                        keys[for_][key] = value;
                    }
                }
            });

            var data = graphml.graphml.data;

            graphml.graphml = {};
            graphml.graphml.key = [];

            var node_keys = Object.keys(keys.node);
            var edge_keys = Object.keys(keys.edge);

            node_keys.forEach(function(k) {
                graphml.graphml.key.push(
                    {
                        '@': {
                            'id': k,
                            'for': 'node',
                            'attr.name': k,
                            'attr.type': 'string'
                        }

                    });
            });

            edge_keys.forEach(function(k) {
                graphml.graphml.key.push(
                    {
                        '@': {
                            'id': k,
                            'for': 'edge',
                            'attr.name': k,
                            'attr.type': 'string'
                        }

                    });
            });

            graphml.graphml.graph = {
                '@': {
                    'id': 'G',
                    'edgedefault': 'directed'
                },
                'node': [],
                'edge': []
            };


            data.forEach(function(cell){
                var type = "node";
                if (cell.$.edge) {
                    type = "edge";
                }

                var data_list = [];


                for (var attr in cell.$) {
                    data_list.push({
                        '@': {
                            'key': attr
                        },
                        '#': cell.$[attr]
                    });
                }

                if (type === 'edge') {
                    graphml.graphml.graph.edge.push(
                        {
                            '@': {
                                'id': cell.$.id,
                                'source': cell.$.source,
                                'target': cell.$.target
                            },
                            'data': data_list
                        }
                    );
                }

                if (type === 'node') {
                    graphml.graphml.graph.node.push(
                        {
                            '@': {
                                'id': cell.$.id
                            },
                            'data':data_list
                        }
                    );
                }



            });

            Codec.builder.attrkey = '@';
            var xml = Codec.builder.buildObject(graphml);
            callback(err, xml);
        }
    })
};

Codec.mxgraph_to_neo4j = function(image_id, fragment_id, callback) {
    Codec.mxgraph_to_flattened_object('../media/uploaded_xmls/' + fragment_id + '.xml', function (err, graph) {
        if (err) {
            callback(err)
        } else {
            var nodes = [];
            var edges = [];

            graph.mxGraphModel.data.forEach(function (cell) {
                if (cell.$.style) {
                    // split style
                    var styles = cell.$.style.split(';').filter(function (a) {
                        return (a.length > 0)
                    });
                    styles.forEach(function (style) {
                        var splits = style.split('=');
                        var key = splits[0];
                        var value = splits[1];
                        if (!cell.$.hasOwnProperty(key)) {
                            cell.$[key] = value;
                        }
                    });
                    delete cell.$.style;
                }

                console.dir(cell);

                var for_ = "node";
                if (cell.$.edge) {
                    for_ = "edge";
                    edges.push(cell);
                } else {
                    nodes.push(cell);
                }


            });
            // create all the nodes
            var all_node_promises = [];
            nodes.forEach(function (cell) {
                all_node_promises.push(database.add_node(image_id, fragment_id, cell.$))
            });
            Promise.all(all_node_promises).then(function (values) {
                // create all the edges
                var all_edge_promises = [];
                if (edges.length > 0) {
                    edges.forEach(function (cell) {
                        all_edge_promises.push(
                            database.add_edge(image_id, fragment_id, cell.$.source, cell.$.target, cell.$)
                        );
                        Promise.all(all_edge_promises).then(function(values){
                            callback(null, values);
                        }, function(err){
                            callback(err, null);
                        });
                    });
                } else {
                    callback(null, values);
                }
                },
            function(err){
                callback(err, null);
            });



        }
    });

};

function classify_node(node) {
    // a node without a geometry is either an object, a group or a layer
    return null;
}

//perform_checks("../media/uploaded_xmls/1.xml");

module.exports = Codec;



