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

/**
* XML Handling
*
* mxGraph xml
*
* @module Codec
* @requires xml2js
*/

var fs = require('fs');
var xml2js = require('xml2js');
var database = require('./database');

/**
 *
 * Codec
 * --------
 * Contains all the methods to convert a mxGraph into a GraphML or to neo4j
 * <br>
*
 * @class Codec
*/
var Codec = Codec || {};

/**
 * The xml2js parser
 *
 * @property parser
 * @type {Object}
 */
Codec.parser = new xml2js.Parser();

/**
 * The xml2js builder
 *
 * This object can create xml files
 *
 * @property builder
 * @type {Object}
 */
Codec.builder = new xml2js.Builder({'attrkey':'@', 'charkey': '#'});

/**
* Get the database driver
 *
 * @method mxgraph_to_object
 * @param filename the resource to load
 * @param callback function(err, data) {...}
*/
Codec.mxgraph_to_object = function(filename, callback) {
    fs.readFile(__dirname + '/' + filename, function(err, data) {
        if (!err) {
            try {
                Codec.parser.parseString(data, function (err, result) {
                    if (err) {
                        return callback(err);
                    } else {
                        if (result === undefined) {
                            return callback('ParseString was not able to parse the xml');
                        }
                        var root = result.mxGraphModel.root[0];

                        // unwrap the <object>s
                        // The objects under root (<object>)
                        if (root.object) {
                            for (var j = 0; j < root.object.length; j++) {
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
                        for (var i = 0; i < root.mxCell.length; i++) {
                            var node = root.mxCell[i];
                            if (node.$.style && node.$.style === "group") {
                                var parent = Codec.get_node_by_id(root, node.$.parent);
                                var children = Codec.get_nodes_by_parent_id(root, node.$.id);
                                for (var j = 0; j < children.length; j++) {
                                    children[j].$.parent = parent.$.id;
                                }
                                root.mxCell[i] = 'x';
                            }
                        }

                        // remove all TO DELETE entries
                        root.mxCell = root.mxCell.filter(function (cell) {
                            return (cell !== 'x')
                        });

                        // The cells in the root (<mxCell>)
                        for (var i = 0; i < root.mxCell.length; i++) {
                            var node = root.mxCell[i];
                            if (node.$.parent) {
                                var parent = Codec.get_node_by_id(root, node.$.parent);
                                if (!parent.children) {
                                    parent.children = []
                                }
                                parent.children.push(node);
                            }
                        }

                        callback(err, result);
                    }

                });
            } catch (e) {
                return callback(err);
            }
        } else {
            return callback(err);
        }
    });
};

/**
 * Works on a mxGraph xml2js-object
 * Finds a node given an id
 *
 * @method get_node_by_id
 * @param root mxGraph tree
 * @param id
 * @returns {node}
 */
Codec.get_node_by_id = function(root, id) {
    for (var i = 0; i<root.mxCell.length; i++) {
        var node = root.mxCell[i];
        if (node.$.id === id) {
            return node;
        }
    }
};

/**
 * Works on a mxGraph xml2js-object
 * Gets all nodes with a given parent
 *
 * @method get_nodes_by_parent_id
 * @param root
 * @param parent_id
 * @returns {Array}
 */
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


/**
 * Converts the mxGraph to an object structured ad follows
 *
 * obj.mxGraphModel.layer1.node1
 *
 * It removes groups
 *
 * @method mxgraph_to_layered_object
 * @param filename
 * @param callback function(err, result) {...}
 */
Codec.mxgraph_to_layered_object = function(filename, callback) {
    Codec.mxgraph_to_object(filename, function(err, result) {
        if (err) {
            return callback(err);
        } else {
			if (!result) {return callback('empty result');}
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

/**
 * Converts an mxGraph to a flot object structured as follows
 *
 * graph.mxGraphModel.data.token1
 * graph.mxGraphModel.data.token2
 * graph.mxGraphModel.data.edge1
 *
 * @method mxgraph_to_flattened_object
 * @param filename
 * @param callback
 */
Codec.mxgraph_to_flattened_object = function(filename, callback) {
    Codec.mxgraph_to_layered_object(filename, function (err, graph) {
        if (err) {
            return callback(err);
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

/**
 * Converts a mxGraph into the GraphML format
 *
 * It removes groups and is not necessary for the code
 * Only nice to have
 *
 * @method mxgraph_to_graphml
 * @param filename
 * @param callback
 */
Codec.mxgraph_to_graphml = function(filename, callback) {
    Codec.mxgraph_to_flattened_object(filename, function (err, graph) {
        if (err) {
            return callback(err);
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

Codec.add_all_completed_fragments_to_neo4j = function() {
    var p = new Promise(function(resolve, reject){
        // TODO: refactor everything with promises
        var counter = 0;
        var target = -1;
        function callback_counter(err) {
            if (err) {
                console.error(err);
            }
            counter++;
            console.log(counter, target);
            if (counter === target) {
                resolve();
            }
        }
        database.get_all_completed_fragments().then(
            function(records) {
                target = records.length;
                records.forEach(function(record){
                    var image_id = record.get('image_id');
                    var fragment_id = record.get('fragment_id');
                    database.remove_fragment(image_id, fragment_id, true).then(function (success) {
                        Codec.mxgraph_to_neo4j(image_id, fragment_id, callback_counter);
                    }, function (err) {
                        console.error(err);
                        reject(err);
                    });
                });
                if (records.length === 0) {
                    resolve();
                }
            },
            function(err) {
                console.error(err);
                reject(err);
            }
        );
    });
    return p;
};

/**
 * Loads an mxGraph over the flat xml2js-object into the neo4j database
 *
 * @method mxgraph_to_neo4j
 * @param image_id
 * @param fragment_id
 * @param callback function(err, data) {...}
 * @param overwrite_xml_path if you don't want to load the standard xml file_path for the fragment use this
 */
Codec.mxgraph_to_neo4j = function(image_id, fragment_id, callback, overwrite_xml_path) {
    if (overwrite_xml_path === undefined) {overwrite_xml_path = false;}
    var xml_path;
    if (!overwrite_xml_path) {
        xml_path = '../media/uploaded_xmls/' + fragment_id + '.xml';
    } else {
        xml_path = overwrite_xml_path;
    }

    Codec.mxgraph_to_flattened_object(xml_path, function (err, graph) {
        if (err) {
            return callback(err);
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
                    // some times the text is in the property label and other times in value
                    // => we want it everytime in value
                    if (cell.$.hasOwnProperty('label')) {
                        cell.$['value'] = cell.$['label'];
                        delete cell.$['label'];
                    }
                    delete cell.$.style;
                }

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
                            return callback(null, values);
                        }, function(err){
                            return callback(err, null);
                        });
                    });
                } else {
                    return callback(null, values);
                }
                },
            function(err){
                callback(err, null);
            });



        }
    });

};

module.exports = Codec;



