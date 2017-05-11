var neo4j = require('neo4j-driver').v1;
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
    if (this.development) {
        return neo4j.driver("bolt://localhost:7687");
    }
    return neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "1234"));
};

/**
 * Get a session to execute Neo4J Cypher code on
 *
 * @method _get_session
 * @private
 * @return {session}
 */
Database._get_session = function () {
    return this._get_driver().session();
};

/**
 * Add the necessary constraints to create something like a schema
 * TODO: describe them
 *
 * @method add_constraints
 * @return {session}
 */
Database._add_constraints = function() {
    var session = this._get_session();
    return session.run("CREATE CONSTRAINT ON (i:Image) ASSERT i.file_path IS UNIQUE; ");
};

/**
 * Remove the constraints
 *
 * @method _remove_constraints
 * @private
 * @return {Promise}
 */
Database._remove_constraints = function() {
    var session = this._get_session();
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





/**
 * Adds an image to the database
 * Sets the upload_date to now in seconds (Math.round(d.getTime() / 1000))
 * Sets completed to false
 *
 * @method add_image
 * @param file_path {string} The unique identifier for an image
 * @return {Promise}
 */
Database.add_image = function(file_path) {
    // TODO: Make file_path to file_name
    // TODO: Make it unique
    var session = this._get_session();
    var d = new Date();
    var upload_date = Math.round(d.getTime() / 1000);
    return session.run("CREATE (a:Image {file_path: {file_path}, upload_date: {upload_date}});",
        {file_path: file_path, upload_date: upload_date});
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
    // Todo: What happens in case of duplications
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
Database.remove_image_by_id = function(id_) {
    var session = this._get_session();
    return session
        .run("MATCH (n:Image)<-[:image]-(f:Fragment)<-[:fragment]-(t:Token) " +
            "WHERE ID(n) = {ident} " +
            "DETACH DELETE t;", {ident: Number(id_)})
        .then(function (result) {
            session.run(
                "MATCH (n:Image)-[:image]-(f:Fragment) " +
                "WHERE ID(n) = {ident} " +
                "DETACH DELETE n,f", {ident: Number(id_)})
                .then(function(result){
                    session.run(
                    "MATCH (n:Image) " +
                    "WHERE ID(n) = {ident} " +
                    "DETACH DELETE n;", {ident: Number(id_)})
                        .then(function(result){
                            session.close();
                            return result;
                        }, function(err){
                            session.close();
                            return err;
                        });

                }, function(err){
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
    var upload_date = Math.round(d.getTime() / 1000);
    return session.run("MATCH (i:Image) " +
        "WHERE ID(i) = {image_id} " +
        "WITH i " +
        "CREATE (:Fragment {fragment_name: {fragment_name}, upload_date: {upload_date}, completed:false})-[:image]->(i);",
        {fragment_name: fragment_name, upload_date: upload_date, image_id: Number(image_id)});
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
    return session.run("MATCH (i:Image)<-[:image]-(f:Fragment)-[:fragment]-(t:Token) " +
        "WHERE ID(i) = {image_id} AND ID(f) = {fragment_id} " +
        "DETACH DELETE t;", {image_id: Number(image_id), fragment_id:Number(fragment_id)})
        .then(function(success) {
                if (!dont_delete_fragment) {
                    session.run("MATCH (i:Image)<-[:image]-(f:Fragment) " +
                        "WHERE ID(i) = {image_id} AND ID(f) = {fragment_id} " +
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
                    session.close();
                    return success;
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
        "RETURN ID(a) as ident, ID(i) as image_id, a.fragment_name AS fragment_name, a.upload_date AS upload_date, a.completed AS completed;",
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
 * @method get_fragment
 * @param image_id
 * @param fragment_id
 * @return {Promise}
 */
Database.get_fragment_by_id = function(image_id, fragment_id) {
    var session = this._get_session();
    var prom = session.run("MATCH (a:Fragment)-[r:image]->(i:Image) " +
        "WHERE ID(a) = {fragment_id} AND ID(i) = {image_id} " +
        "RETURN ID(a) as ident, ID(i) as image_id, a.fragment_name AS fragment_name, a.upload_date AS upload_date, a.completed AS completed;",
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
 * Adds a node to a fragment of an image
 *
 * Promise:success  number_of_created_nodes
 *
 * @method add_node
 * @param image_id
 * @param fragment_id
 * @param node_attributes
 * @return {Promise}
 */
Database.add_node = function(image_id, fragment_id, node_attributes) {
    // check if all the necessary attributes are there

    var enumerator = node_attributes.id;
    var session = this._get_session();
    var prom = session.run("MATCH (i:Image)<-[:image]-(f:Fragment) " +
        "WHERE ID(i) = {image_id} AND ID(f) = {fragment_id} " +
        "WITH f " +
        "CREATE (n:Token {enumerator:{enumerator}})-[:fragment]->(f) " +
        "SET n += {props};",
        {fragment_id: Number(fragment_id), image_id: Number(image_id), enumerator:Number(enumerator),
        props:node_attributes})
        .then(function (result) {
            session.close();
            var number_of_created_nodes = result.summary.updateStatistics._stats.nodesCreated;
            return number_of_created_nodes;
        }, function(err){
            session.close();
            console.log(err);
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
        "WHERE ID(i) = {image_id} AND ID(f) = {fragment_id} " +
        "WITH f " +
        "MATCH (f)<-[:fragment]-(a:Token {enumerator: {source_enum} }), (f)<-[:fragment]-(b:Token {enumerator: {target_enum} }) " +
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
            session.close();
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
    // TODO: add pagination
    var session = this._get_session();
    var prom = session
        .run("MATCH (a:Image) " +
            "WITH a " +
            "ORDER BY a.last_edit_date, a.upload_date " +
            "RETURN " +
            "ID(a) as ident," +
            "a.file_path as file_path, " +
            "a.upload_date as upload_date;")
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

Database.get_fragments_by_image_id = function(image_id) {
    var session = this._get_session();
    var prom = session
        .run("MATCH (a:Image)-[r]-(f:Fragment) " +
            "WITH a,f " +
            "ORDER BY f.upload_date " +
            "RETURN " +
            "ID(a) as image_id," +
            "a.file_path as file_path, " +
            "ID(f) as fragment_id, " +
            "f.fragment_name as fragment_name, " +
            "f.upload_date as upload_date," +
            "f.completed as completed;"
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
 * Returns all possible property keys for tokens filtered by search_string
 * Is used for the autocomplete function of the add-property-input
 *
 * Promise:success: Array of strings
 *
 * @method get_all_property_keys_for_token
 * @param search_string {string} Empty string gives all possible values
 * @return {Promise}
 */
Database.get_all_property_keys_for_token = function(search_string) {
    var session = this._get_session();
    var prom = session
        .run("MATCH (p:Token) WITH DISTINCT keys(p) AS keys " +
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
Database.get_all_property_values_for_token = function(property, search_string) {
    var session = this._get_session();
    var prom = session
        .run("MATCH (n: Token) " +
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