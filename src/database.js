var neo4j = require('neo4j-driver').v1;
var utils = require('./utils')
//var config = require('../config.json');

/**
* Database wrapper functions for Neo4J
*
* @module Database
* @requires neo4j-driver
*/

/**
 *
 * Database
 * --------
 * Contains all the database access methods
 * <br>
 * <b>Caution: The responses are promises</b>
 * <p>Singleton because...</p>
*
 * @class Database
*/
var Database = Database || {};

/**
 * The development flag controls the basic auth credentials
 *
 * @property development
 * @type {boolean}
 * @default false
 */
Database.development = false;

/**
 * Stores the neo4j-driver for the method <_get_driver>
 *
 * @property _driver
 * @type {driver}
 * @private
 * @default null
 */
Database._driver = null;

/**
 * Stores whether a successful login took place
 *
 * @property _logged_in
 * @type {boolean}
 * @default false
 */
Database.logged_in = false;

/**
* Try to fetch a neo4j driver with the given credentials
 * if that works, the Database._driver is not null anymore.
 * It also set the Database.logged_in to true
 *
* @method login
* @return {boolean|error}
*/
Database.login = function (url, user, password){
    var p = new Promise(function(resolve, reject) {
        // the _driver is the actual flag for the state
        if (Database._driver !== null) {
            Database.logged_in = true;
            resolve();
        } else {
            try {
                Database._driver = neo4j.driver(url, neo4j.auth.basic(user, password));
                /*Database._driver.onCompleted = function () {
                    console.log("ON COMP");
                };*/

                Database._driver.onError = function (error) {
                    Database._driver = null;
                    Database.logged_in = false;
                    Database._driver = null;
                    return reject(error);
                };

                var session = Database._get_session();
                return session.run('return 1').then(
                    function() {
                        Database.logged_in = true;
                        return Database._hygiene().then(function(res) {
                            return resolve();
                        },
                        function(err){
                            Database._driver = null;
                            Database.logged_in = false;
                            console.error(err);
                            return reject(err);
                        });
                    },
                    function(err) {
                        Database._driver = null;
                        Database.logged_in = false;
                        reject(err);
                    }
                );
            } catch (err) {
                Database._driver = null;
                Database.logged_in = false;
                return reject(err);
            }
        }
    });
    return p;
};



/**
 * Logout from the current database neo4j session.
 * Delete the saved neo4j session and set the Database.logged_in flag to false.
 *
* @method logout
* @return {boolean}
*/
Database.logout = function (){
    var driver = Database._get_driver();
    if (driver) {
        console.log("... neo4j driver closed")
        driver.close();
    }
    Database._driver = null;
    Database.logged_in = false;
};

/**
* Get the database driver
 * stores the instance in _driver
 * makes use of the development flag in order to use or not use basic auth
 *
* @method _get_driver
 * @private
* @return {driver} Returns a bolt:// driver instance
*/
Database._get_driver = function (){
    if (this._driver !== null) {
        return this._driver;
    }
    return false;
};

/**
 * Get a session to execute Neo4J Cypher code on
 *
 * @method _get_session
 * @private
 * @return {session}
 */
Database._get_session = function () {
    var driver = Database._get_driver();
    if (!driver) {
        console.error("Could not fetch driver");
        return null;
    } else {
        return driver.session();
    }

};

/**
 * Add the necessary constraints to create something like a schema
 * 1) The file_path of an image is unique
 *
 * @method add_constraints
 * @return {session}
 */
Database._add_constraints = function() {
    var session = this._get_session();
    return session.run("CREATE CONSTRAINT ON (i:Image) ASSERT i.file_path IS UNIQUE; ");
};

/**
 * Clean up the database on login
 *
 * 1) remove nodes without edges (-> MetaGroups that are not referenced)
 *
* @method _hygiene
* @return {Promise}
*/
Database._hygiene = function (){
    var session = Database._get_session();
    // this query removes all free swimming nodes (without any edges)
    return session.run("match (n) where not (n)--() delete (n);");
};

/**
 * Remove the constraints
 *
 * @method _remove_constraints
 * @private
 * @return {Promise}
 */
Database._remove_constraints = function() {
    var session = Database._get_session();
    return session.run("DROP CONSTRAINT ON (i:Image) ASSERT i.file_path IS UNIQUE; ");
};

/**
 * Do the initialization on start
 * 1) drop and then create constraint
 *
 * @method init
 * @return {session}
 */
Database.init = function(callback) {
    return Database._remove_constraints().then(function(){
        return Database._add_constraints()
    }, function(){
        return Database._add_constraints()
    });
};


Database.toggle_fragment_completed = function(image_id, fragment_id) {
    var session = Database._get_session();
    var prom = session.run("MATCH (a:Fragment)-[r:image]->(i:Image) " +
        "WHERE ID(a) = toInteger({fragment_id}) AND ID(i) = toInteger({image_id}) " +
        "SET a.completed = NOT a.completed " +
        "RETURN a;",
        {image_id: Number(image_id), fragment_id: Number(fragment_id)})
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            return records[0];
        }, function(err){
            console.error(err);
            session.close();
            return err;
        });
    return prom;
};


/**
 * Adds an image to the database
 * Sets the upload_date to now in seconds (Math.round(d.getTime() / 1000))
 *
 * @method add_image
 * @param file_path {string} The unique identifier for an image
 * @param exif_data
 * @return {Promise}
 */
Database.add_image = function(file_path, exif_data) {
    var session = this._get_session();
    var d = new Date();
    var upload_date = Math.round(d.getTime());
    var cql = "CREATE (a:Image {file_path: {file_path}, upload_date: {upload_date}}) RETURN ID(a) as ident;";
    var meta_data = null;
    if (exif_data) {
        cql = "CREATE (a:Image {file_path: {file_path}, upload_date: {upload_date}}) " +
            "SET a += {meta_data} " +
            "RETURN ID(a) as ident;";
        meta_data =  exif_data['gps'] || {};
        if (exif_data.hasOwnProperty('exif') && exif_data['exif'].hasOwnProperty('ExifImageWidth')
            && exif_data['exif'].hasOwnProperty('ExifImageHeight')) {
            Object.assign(meta_data, {
                width:  exif_data.exif.ExifImageWidth,
                height: exif_data.exif.ExifImageHeight
            });
        }
        // Get the upload_date from the creation date exif tag
        if (exif_data && exif_data.hasOwnProperty('exif') && exif_data['exif'].hasOwnProperty('CreateDate')) {
            // might look like this 2017:05:28 19:46:49
            try {
                var raw_format = exif_data['exif']['CreateDate'];
                if (raw_format.indexOf(" ") >= 0) {
                    var splits = raw_format.split(" ");
                    var parsed_date = Number(Date.parse(splits[0], 'yyyy:MM:dd'));
                    if (parsed_date) {
                        upload_date = parsed_date;
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        Object.keys(meta_data).forEach(function(key) {
            meta_data[key] = meta_data[key].valueOf();
            if  (meta_data[key] instanceof Buffer) {
                meta_data[key] = meta_data[key].toString();
            }
        });
    }

    var p = session.run(cql,
        {file_path: file_path, upload_date: upload_date, meta_data: meta_data})
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            if (records.length === 0) {
                throw Error('Zero elements created');
            }
            return records[0];
        }, function(err) {
            console.error(err);
            session.close();
            return err;
        });
    return p;
};

/**
 * Get image from database by file_path
 *
 * Promise: success: Contains record for the image
 *
 * @method get_image
 * @param file_path {string} The unique identifier for an image
 * @return {Promise}
 */
Database.get_image = function(file_path){
    // Duplications are silent for some reason
    var session = this._get_session();
    var prom = session
        .run("MATCH (a:Image {file_path: {file_path}}) return ID(a) as ident, a;", {file_path: file_path})
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            return records[0];
        }, function(err) {
            session.close();
            return err;
        });
    return prom;
};

Database.get_image_of_token = function(token_id){
    var session = this._get_session();
    var prom = session
        .run("MATCH (t:Token)-[]-(f:Fragment)-[]-(i:Image) WHERE ID(t) = toInteger({token_id}) RETURN i, ID(f) as fragment_id, ID(i) AS image_id;",
            {token_id: Number(token_id)})
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            return records[0];
        }, function(err) {
            session.close();
            return err;
        });
    return prom;
};

/**
 *
 * @param token_id
 * @returns {*|Promise}
 */
Database.get_fragment_bounding_box = function(token_id){
    var session = this._get_session();
    var prom = session
        .run("MATCH (t:Token)-[]-(f:Fragment) WHERE ID(t) = toInteger({token_id}) "+
            "WITH f " +
            "MATCH (x:Token)-[]-(f) " +
            "WITH x, f "+
            "WHERE EXISTS(x.x) AND EXISTS(x.y) AND EXISTS(x.width) AND EXISTS(x.height) "+
            "RETURN MIN(toInteger(x.x)) as x, MIN(toInteger(x.y)) as y, " +
            "MAX(toInteger(x.x)+toInteger(x.width)) as width, MAX(toInteger(x.y)+toInteger(x.height)) as height, ID(f) AS fragment_id;",
            {token_id: Number(token_id)})
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            if (records.length === 0) {
                return null;
            }
            return records[0];
        }, function(err) {
            session.close();
            return err;
        });
    return prom;
};

/**
 * Removes an image by ID
 *
 * @method remove_image_by_id
 * @param id_ {String|Number}
 * @return {Promise}
 */
Database.remove_image_by_id = function (id_) {
    var session = this._get_session();
    return session.run(
        "MATCH (n:Image) " +
        "WHERE ID(n) = toInteger({ident}) " +
        "RETURN n.file_path as file_path", {ident: Number(id_)})
        .then(function (result) {
            var file_path = result.records[0].get("file_path");
            try {
                utils.remove_image(file_path);
            } catch (e) {
                console.log("Image node is being deleted but there was an error finding the local image file: "+e);
            }
            return session
                .run("MATCH (n:Image)<-[:image]-(f:Fragment)<-[:fragment]-(t:Token) " +
                    "WHERE ID(n) = toInteger({ident}) " +
                    "DETACH DELETE t;", {ident: Number(id_)})
                .then(function (result) {
                    return session.run(
                        "MATCH (n:Image)-[:image]-(f:Fragment) " +
                        "WHERE ID(n) = toInteger({ident}) " +
                        "DETACH DELETE n,f", {ident: Number(id_)})
                        .then(function (result) {
                            return session.run(
                                "MATCH (n:Image) " +
                                "WHERE ID(n) = toInteger({ident}) " +
                                "DETACH DELETE n;", {ident: Number(id_)})
                                .then(function (result) {
                                    session.close();
                                    return result;
                                }, function (err) {
                                    session.close();
                                    return err;
                                });

                        }, function (err) {
                            session.close();
                            return err;
                        });
                }, function (err) {
                    session.close();
                    return err;
                });
        }, function (err) {
            session.close();
            return err;
        });
};

/**
 * Adds a fragment to an image
 * Every image can have multiple fragments
 * the name of the fragment is unique
 *
 * @method add_fragment
 * @param image_id
 * @param fragment_name The identifier for the fragment
 * @return {Promise}
 */
Database.add_fragment = function(image_id, fragment_name) {
    var session = this._get_session();
    var d = new Date();
    var upload_date = Math.round(d.getTime());
    return session.run("MATCH (i:Image) " +
        "WHERE ID(i) = toInteger({image_id}) " +
        "WITH i " +
        "CREATE (f:Fragment {fragment_name: {fragment_name}, upload_date: {upload_date}, completed:false, comment:{comment}})-[:image]->(i) " +
        "RETURN ID(f) as ident, ID(i) AS image_ident;",
        {fragment_name: fragment_name, upload_date: upload_date, image_id: Number(image_id), comment: ''})
        .then(function(result){
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            return records[0];
        }, function(err){return err;})
};

Database.add_comment_to_fragment = function(fragment_id, comment) {
    var session = this._get_session();
    return session.run(
        "MATCH (f:Fragment) " +
        "WHERE ID(f) = toInteger({fragment_id}) " +
        "SET f += {comment: {comment}} " +
        "RETURN ID(f) as ident;",
        {
            fragment_id: fragment_id,
            comment: comment
        }
    ).then(function(result){
        session.close();
        var records = [];
        for (var i = 0; i < result.records.length; i++) {
            records.push(result.records[i]);
        }
        return records[0];
    }, function(err){
        session.close();
        return err;
    });

};

/**
 * Removes all fragments of an image with a given name
 *
 * @method remove_fragment
 * @param image_id
 * @param fragment_id
 * @param dont_delete_fragment
 * @return {Promise}
 */
Database.remove_fragment = function(image_id, fragment_id, dont_delete_fragment) {
    if (dont_delete_fragment === undefined) {dont_delete_fragment=true;}
    var session = this._get_session();
    return session.run("MATCH (i:Image)<-[:image]-(f:Fragment)-[:fragment]-(t) " +
        "WHERE ID(i) = toInteger({image_id}) AND ID(f) = toInteger({fragment_id}) " +
        "DETACH DELETE t;", {image_id: Number(image_id), fragment_id:Number(fragment_id)})
        .then(function(success) {
                if (!dont_delete_fragment) {
                    return session.run("MATCH (i:Image)<-[:image]-(f:Fragment) " +
                        "WHERE ID(i) = toInteger({image_id}) AND ID(f) = toInteger({fragment_id}) " +
                        "DETACH DELETE f;", {image_id: Number(image_id), fragment_id: Number(fragment_id)})
                        .then(
                            function (result) {
                                session.close();
                                return result;
                            }, function (err) {
                                session.close();
                                return err;
                            }
                        );
                } else {
                    var hash = utils.hash_xml_fragment(fragment_id);
                    return session.run("MATCH (i:Image)<-[:image]-(f:Fragment) " +
                        "WHERE ID(i) = toInteger({image_id}) AND ID(f) = toInteger({fragment_id}) " +
                        "SET f.hash = {hash};", {image_id: Number(image_id), fragment_id: Number(fragment_id),
                                                hash: hash})
                        .then(
                            function (result) {
                                session.close();
                                return result;
                            }, function (err) {
                                session.close();
                                return err;
                            }
                        );
                }
            }, function (err) {
                session.close();
                return err;
            }

        );
};

/**
 * Get the fragment of an image by name
 *
 * @method get_fragment
 * @param image_file_path {String}  The unique id for the image
 * @param fragment_name The identifier for the fragments
 * @return {Promise}
 */
Database.get_fragment = function(image_file_path, fragment_name) {
    var session = this._get_session();
    var prom = session.run("MATCH (a:Fragment {fragment_name: {fragment_name}})-[r:image]->(i:Image {file_path:{file_path}}) " +
        "RETURN ID(a) as ident, ID(i) as image_id, a.fragment_name AS fragment_name, a.upload_date AS upload_date, a.completed AS completed, a.comment as comment;",
        {fragment_name: fragment_name, file_path: image_file_path})
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            return records[0];
        });
    return prom;
};




/**
 * Get the fragment of an image by name
 *
 * @method get_fragment_by_id
 * @param image_id
 * @param fragment_id
 * @return {Promise}
 */
Database.get_fragment_by_id = function(image_id, fragment_id) {
    var session = this._get_session();
    var prom = session.run("MATCH (a:Fragment)-[r:image]->(i:Image) " +
        "WHERE ID(a) = toInteger({fragment_id}) AND ID(i) = toInteger({image_id}) " +
        "RETURN ID(a) as ident, ID(i) as image_id, a.fragment_name AS fragment_name, a.upload_date AS upload_date, a.completed AS completed, a.comment AS comment;",
        {image_id: Number(image_id), fragment_id: Number(fragment_id)})
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            return records[0];
        }, function(err){
            session.close();
            return err;
        });
    return prom;
};

/**
 * Get the fragment of an image by name
 *
 * @method get_all_fragments
 * @return {Promise}
 */
Database.get_all_fragments = function() {
    var session = this._get_session();
    var prom = session.run("MATCH (f:Fragment) RETURN ID(f) as identifier;")
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(Number(result.records[i].get('identifier')));
            }
            return records;
        }, function(err){
            session.close();
            return err;
        });
    return prom;
};

/**
 * Adds a node to a fragment of an image
 *
 * Promise:success  number_of_created_nodes
 *
 * @method add_node
 * @param image_id
 * @param fragment_id
 * @param node_label
 * @param node_attributes
 * @return {Promise}
 */
Database.add_node = function(image_id, fragment_id, node_label, node_attributes) {
    // check if all the necessary attributes are there
    if (!['Token', 'Group'].includes(node_label)) {
        throw Error('Invalid node label (add_node)');
    }
    var enumerator = node_attributes.id;
    var session = this._get_session();
    var query = "MATCH (i:Image)<-[:image]-(f:Fragment) " +
        "WHERE ID(i) = toInteger({image_id}) AND ID(f) = toInteger({fragment_id}) " +
        "WITH f " +
        "CREATE (n:" + node_label + " {enumerator:{enumerator}})-[:fragment]->(f) " +
        "SET n += {props} " +
        "RETURN ID(n) as ident;";
    var prom = session.run(query,
        {fragment_id: Number(fragment_id), image_id: Number(image_id), enumerator:Number(enumerator),
        props:node_attributes, node_label: node_label})
        .then(function (result) {
            session.close();
            if (node_attributes.hasOwnProperty('groupType')) {
                if (node_attributes.groupType === 'frame') {
                    var group_id = Number(result.records[0].get('ident'));
                    return Database.add_frame_edge(group_id, node_attributes.value, 'MetaFrame');
                }
            }
            return result;
        }, function(err){
            session.close();
            console.error(err);
            return err;
        });
    return prom;
};

/**
 * Adds an edge between a frame from a group and a global frame
 * so called 'meta frame'
 *
 * Also creates the 'meta frame' if it does not exist *
 *
 * @method add_edge
 * @return {Promise}
 * @param node_id
 * @param frame_name
 */
Database.add_frame_edge = function(node_id, frame_name, groupType) {
    var session = this._get_session();
    var prom = session.run(
        "MATCH (b:Group) " +
        "WHERE ID(b) = toInteger({node_id}) " +
        "WITH b " +
        "MERGE (m:MetaGroup {value:{frame_name}, groupType:{groupType}}) " +
        "CREATE (m)<-[n:PartOf]-(b) " +
        "",
        {node_id: node_id, frame_name:frame_name, groupType:groupType})
        .then(function (result) {
            session.close();
            return result;
        }, function(err) {
            console.error(err);
            session.close();
            return err;
        });
    return prom;
};

/**
 * Adds an edge between two nodes
 * in a fragment of an image
 *
 * Promise:success  number_of_created_edges
 *
 * @method add_edge
 * @param image_id
 * @param fragment_id
 * @param source_enum
 * @param target_enum
 * @param edge_attributes
 * @return {Promise}
 */
Database.add_edge = function(image_id, fragment_id, source_enum, target_enum, edge_attributes) {
    var enumerator = edge_attributes.id;
    var session = this._get_session();
    var prom = session.run("MATCH (i:Image)<-[:image]-(f:Fragment) " +
        "WHERE ID(i) = toInteger({image_id}) AND ID(f) = toInteger({fragment_id}) " +
        "WITH f " +
        "MATCH (f)<-[:fragment]-(a {enumerator: {source_enum} }), (f)<-[:fragment]-(b {enumerator: {target_enum} }) " +
        "CREATE (a)-[n:edge]->(b) " +
        "SET n += {props};",
        {fragment_id: Number(fragment_id), image_id: Number(image_id),
            source_enum:Number(source_enum), target_enum:Number(target_enum),
            props:edge_attributes
        })
        .then(function (result) {
            session.close();
            return result;
        }, function(err) {
            console.error(err);
            session.close();
            return err;
        });
    return prom;
};


/**
 * Returns a promise with an array of records of images
 * ordered by last_edit_date, upload_date
 *
 * @example
       database.get_all_images().then(function (results) {
            var row_data = [];
            results.forEach(function (r) {
                row_data.push([r.get('ident'), r.get('file_path'), r.get('upload_date'), r.get('completed')]);
            });
            res.render('table',
                {
                    title: 'Hey',
                    message: 'Hello there!',
                    rows: row_data
                });
            }
        );
 *
 * @method get_all_images
 * @return {Promise}
 */
Database.get_all_images = function() {
    // pagination is not necessary so far (the page behaved well with 300 images in a test)
    var session = this._get_session();
    var prom = session
        .run("MATCH (a:Image) " +
            "OPTIONAL MATCH (a)-[]-(f1:Fragment {completed:false}) " +
            "OPTIONAL MATCH (a)-[]-(f2:Fragment {completed:true}) " +
            "WITH a, f1, f2 " +
            "ORDER BY a.last_edit_date, a.upload_date " +
            "RETURN " +
            "ID(a) as ident," +
            "a.file_path as file_path, " +
            "a.upload_date as upload_date, " +
            "COUNT(f1) AS num_uncompleted_fragments," +
            "COUNT(f2) AS num_completed_fragments;")
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            return records;
        });
    return prom;
};

/**
 * Get all fragments of one image
 *
 * @method get_fragments_by_image_id
 * @param image_id
 * @returns {*|Promise}
 */
Database.get_fragments_by_image_id = function(image_id) {
    var session = this._get_session();
    var prom = session
        .run("MATCH (a:Image)-[r]-(f:Fragment) " +
            "WHERE ID(a) = toInteger({image_id})" +
            "WITH a,f " +
            "ORDER BY f.upload_date " +
            "RETURN " +
            "ID(a) as image_id," +
            "a.file_path as file_path, " +
            "ID(f) as fragment_id, " +
            "f.fragment_name as fragment_name, " +
            "f.upload_date as upload_date, " +
            "f.completed as completed, " +
            "f.comment as comment;",
            {image_id: Number(image_id)}
        )
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            return records;
        });
    return prom;
};

/**
 * Get all completed fragments
 *
 * @returns {*|Promise}
 */
Database.get_all_completed_fragments = function() {
    var session = this._get_session();
    var prom = session
        .run("MATCH (a:Image)-[r]-(f:Fragment {completed:true}) " +
            "WITH a,f " +
            "RETURN " +
            "ID(a) as image_id, " +
            "f.hash as hash, " +
            "ID(f) as fragment_id; ")
        .then(function (result) {
            session.close();
            var records = [];
            for (var i = 0; i < result.records.length; i++) {
                records.push(result.records[i]);
            }
            return records;
        }, function(err){
            console.error(err);
            return err;
        });
    return prom;
};

/**
 * Returns all possible property keys for tokens filtered by search_string
 * Is used for the autocomplete function of the add-property-input
 *
 * Promise:success: Array of strings
 *
 * @method get_all_property_keys_for_token
 * @param search_string {string} Empty string gives all possible values
 * @return {Promise}
 */
Database.get_all_property_keys_for_token = function(search_string, label) {
    if (label === undefined) {
        label = 'Token'
    }
    var session = this._get_session();
    var prom = session
        .run("MATCH (p:"+ label +") WITH DISTINCT keys(p) AS keys " +
            "UNWIND keys AS keyslisting WITH DISTINCT keyslisting AS allfields " +
            "WHERE allfields CONTAINS {search_string}" +
            "RETURN allfields;", {search_string: search_string || ''})
        .then(function (result) {
            session.close();
            var keys = [];
            for (var i = 0; i < result.records.length; i++) {
                keys.push(result.records[i]['_fields'][0]);
            }
            return keys;
        });
    return prom;
};

/**
 * Returns all distinct values for the given property in a string list in a promise
 * Is used for the autocomplete function of the property values
 *
 * Promise:success: Array of strings *
 *
 * @method get_all_property_values_for_token
 * @param property {string} the name of a property of tokens
 * @param search_string {string} that filters the result (empty string is not filter)
 * @return {Promise}
 */
Database.get_all_property_values_for_token = function(property, search_string, label) {
    if (label === undefined) {
        label = 'Token'
    }
    var session = this._get_session();
    var prom = session
        .run("MATCH (n:"+label+") " +
            "WHERE n[{property}] IS NOT NULL " +
            "AND n[{property}] CONTAINS {search_string} " +
            "RETURN distinct n[{property}];",
            {property: property,
            search_string: search_string || ''}
        )
        .then(function (result) {
            session.close();
            var values = [];
            for (var i = 0; i < result.records.length; i++) {
                values.push(result.records[i]['_fields'][0]);
            }
            return values;
        },
        function (err) {
            session.close();
            return err;
        });
    return prom;
};

module.exports = Database;