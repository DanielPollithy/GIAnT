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
    return session.run("CREATE (a:Image {file_path: {file_path}, upload_date: {upload_date}, completed:false})",
        {file_path: file_path, upload_date: upload_date});
};

/**
 * Remove image from database
 *
 * Promise: success: Contains number_of_deleted_nodes as param
 *
 * @method remove_image
 * @param file_path {string} The unique identifier for an image
 * @return {Promise}
 */
Database.remove_image = function(file_path){
    // TODO: Delete all attached Tokens
    var session = this._get_session();
    return prom = session
        .run("MATCH (n:Image {file_path: {file_path}}) DELETE n",
            {file_path: file_path})
        .then(function (result) {
            session.close();
            var number_of_deleted_nodes = result.summary.updateStatistics._stats.nodesDeleted;
            return number_of_deleted_nodes;
        });
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
        .run("MATCH (n:Image) WHERE ID(n) = {ident} DELETE n", {ident: Number(id_)})
        .then(function (result) {
            session.close();
            var number_of_deleted_nodes = result.summary.updateStatistics._stats.nodesDeleted;
            return number_of_deleted_nodes;
        });
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
            "a.upload_date as upload_date, " +
            "a.completed as completed")
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
        function (err) {console.log(err);});
    return prom;
};

module.exports = Database;