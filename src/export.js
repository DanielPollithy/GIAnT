/**
 * Export the neo4j data to sql or csv
 *
 *      Tables
 *          - Nodes
 *          - Edges
 *          - NodeProperties
 *          - EdgeProperties
 *
 *
 *      1) stream the data into temporary files
 *      2) make the files downloadable for the client
 *      3) delete the temporary files
 *
 *
 *      CREATE TABLE IF NOT EXISTS Node (
 *      Node_ID INTEGER AUTO_INCREMENT,
 *      tokenType TEXT,
 *      groupType TEXT,
 *      PRIMARY KEY (Node_ID)
 *      );
 *
 *      CREATE TABLE IF NOT EXISTS Relation (
 *      Relation_ID INTEGER AUTO_INCREMENT,
 *      SourceNode_ID INTEGER,
 *      TargetNode_ID INTEGER,
 *      relationType TEXT,
 *      PRIMARY KEY (Relation_ID)
 *      );
 *
 *      CREATE TABLE IF NOT EXISTS NodeProperties (
 *      NodeProperties_ID INTEGER AUTO_INCREMENT,
 *      key_ TEXT,
 *      value_ TEXT,
 *      Node_ID INTEGER,
 *      PRIMARY KEY (NodeProperties_ID)
 *      );
 *
 *      CREATE TABLE IF NOT EXISTS RelationProperties (
 *      RelationProperties_ID INTEGER AUTO_INCREMENT,
 *      key_ TEXT,
 *      value_ TEXT,
 *      PRIMARY KEY (RelationProperties_ID)
 *      );
 *
 * @class Export
 */
var Export = Export || {};


var log = require('electron-log');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var archiver = require('archiver');
var database = require('./database');




/**
 * The target folder where the exports are stored
 *
 * @property to_folder
 * @type {string}
 * @default path.join(__dirname, '..', 'media', 'export')
 */
Export.to_folder = path.join(__dirname, '..', 'media', 'export');

/**
* Get the current time as POSIX time as a string
 *
* @method _get_time
* @return {string}
*/
Export._get_time = function () {
    var d = new Date();
    var upload_date = Math.round(d.getTime());
    return upload_date + '';
};

/**
 * Writes sql code into the given write_stream
 *
 * Starts with the SQL Table creation and then adds all nodes
 *
 * @method _nodes_to_sql
 * @param write_stream {WriteStream}
 * @return {Promise}
 */
Export._nodes_to_sql = function (write_stream) {
    return new Promise(function (resolve, reject) {
        try {
            var session = database._get_session();
            write_stream.write(
                'CREATE TABLE IF NOT EXISTS Nodes ( \n' +
                'Node_ID INTEGER, \n' +
                'value_ TEXT, \n' +
                'tokenType TEXT, \n' +
                'groupType TEXT, \n' +
                'PRIMARY KEY (Node_ID) \n' +
                '); \n\n'
            );
        } catch (e) {
            return reject(e);
        }

        session.run("MATCH (n) RETURN ID(n) as ident, n.value as value, n.tokenType as tokenType, n.groupType as groupType;")
            .subscribe({
                    onNext: function (record) {
                        write_stream.write('INSERT INTO Nodes (Node_ID, value_, tokenType, groupType) VALUES (');
                        write_stream.write(record.get('ident').toString() + ', ');
                        write_stream.write((record.get('value') ? '"' + encodeURIComponent(record.get('value')) + '"' : 'NULL') + ', ');
                        write_stream.write((record.get('tokenType') ? '"' + encodeURIComponent(record.get('tokenType')) + '"' : 'NULL') + ', ');
                        write_stream.write((record.get('groupType') ? '"' + encodeURIComponent(record.get('groupType')) + '"' : 'NULL') + ');\n  ');
                    },
                    onCompleted: function () {
                        session.close();
                        return resolve();
                    },
                    onError: function (error) {
                        log.error(error);
                        reject();
                    }
                }
            );
    });
};

/**
 * Writes sql code into the given write_stream
 *
 * Starts with the SQL Table creation for relations and then adds all relations
 *
 * @method _relations_to_sql
 * @param write_stream {WriteStream}
 * @return {Promise}
 */
Export._relations_to_sql = function (write_stream) {
    return new Promise(function (resolve, reject) {
        try {
            var session = database._get_session();
            write_stream.write(
                '\nCREATE TABLE IF NOT EXISTS Relations ( \n' +
                'Relation_ID INTEGER, \n' +
                'relationType TEXT, \n' +
                'SourceNode_ID INTEGER REFERENCES Nodes (Node_ID), \n' +
                'TargetNode_ID INTEGER REFERENCES Nodes (Node_ID), \n' +
                'PRIMARY KEY (Relation_ID)\n' +
                '); \n\n'
            );
        } catch (e) {
            return reject(e);
        }

        session.run("MATCH ()-[r]-() RETURN DISTINCT ID(r) as ident, TYPE(r) as type, ID(STARTNODE(r)) as origin, ID(ENDNODE(r)) as target;")
            .subscribe({
                    onNext: function (record) {
                        write_stream.write('INSERT INTO Relations (Relation_ID, relationType, SourceNode_ID, TargetNode_ID) VALUES (');
                        write_stream.write(record.get('ident').toString() + ', ');
                        write_stream.write((record.get('type') ? '"' + encodeURIComponent(record.get('type')) + '"' : 'NULL') + ', ');
                        write_stream.write(record.get('origin').toString() + ', ');
                        write_stream.write(record.get('target').toString() + '); \n');
                    },
                    onCompleted: function () {
                        session.close();
                        return resolve();
                    },
                    onError: function (error) {
                        log.error(error);
                        reject();
                    }
                }
            );
    });
};

/**
 * Writes sql code into the given write_stream
 *
 * Starts with the SQL Table creation for relation properties and then adds all properties
 *
 * @method _relation_properties_to_sql
 * @param write_stream {WriteStream}
 * @return {Promise}
 */
Export._relation_properties_to_sql = function (write_stream) {
    return new Promise(function (resolve, reject) {
        try {
            var session = database._get_session();
            write_stream.write(
                '\nCREATE TABLE IF NOT EXISTS RelationProperties ( \n' +
                'RelationProperty_ID INTEGER AUTO_INCREMENT, \n' +
                'Relation_ID INTEGER REFERENCES Relations, \n' +
                'key_ TEXT, \n' +
                'value_ TEXT, \n' +
                'PRIMARY KEY (RelationProperty_ID) \n' +
                '); \n\n'
            );
        } catch (e) {
            return reject(e);
        }

        session.run("Match ()-[n]-() return DISTINCT ID(n) as ident, properties(n) as props;")
            .subscribe({
                    onNext: function (record) {
                        var props = record.get('props');
                        Object.keys(props).forEach(function(key) {
                            var value = props[key];
                            write_stream.write('INSERT INTO RelationProperties (Relation_ID, key_, value_) VALUES (');
                             write_stream.write(record.get('ident').toString() + ', ');
                             write_stream.write((key ? '"' + encodeURIComponent(key) + '"' :  'NULL') + ', ');
                             write_stream.write((value ? '"' + encodeURIComponent(value) + '"' :  'NULL') + '); \n');
                        });
                    },
                    onCompleted: function () {
                        session.close();
                        return resolve();
                    },
                    onError: function (error) {
                        log.error(error);
                        reject();
                    }
                }
            );
    });
};

/**
 * Writes sql code into the given write_stream
 *
 * Starts with the SQL Table creation for node properties and then adds all properties
 *
 * @method _node_properties_to_sql
 * @param write_stream {WriteStream}
 * @return {Promise}
 */
Export._node_properties_to_sql = function (write_stream) {
    return new Promise(function (resolve, reject) {
        try {
            var session = database._get_session();
            write_stream.write(
                '\nCREATE TABLE IF NOT EXISTS NodeProperties ( \n' +
                'NodeProperty_ID INTEGER AUTO_INCREMENT, \n' +
                'Node_ID INTEGER REFERENCES Nodes, \n' +
                'key_ TEXT, \n' +
                'value_ TEXT, \n' +
                'PRIMARY KEY (NodeProperty_ID) \n' +
                '); \n\n'
            );
        } catch (e) {
            return reject(e);
        }

        session.run("Match (n) return DISTINCT ID(n) as ident, properties(n) as props;")
            .subscribe({
                    onNext: function (record) {
                        var props = record.get('props');
                        Object.keys(props).forEach(function(key) {
                            var value = props[key];
                            write_stream.write('INSERT INTO NodeProperties (Node_ID, key_, value_) VALUES (');
                             write_stream.write(record.get('ident').toString() + ', ');
                             write_stream.write((key ? '"' + encodeURIComponent(key) + '"' :  'NULL') + ', ');
                             write_stream.write((value ? '"' + encodeURIComponent(value) + '"' :  'NULL') + '); \n');
                        });
                    },
                    onCompleted: function () {
                        session.close();
                        return resolve();
                    },
                    onError: function (error) {
                        log.error(error);
                        reject();
                    }
                }
            );
    });
};

/**
 * Writes csv into the given write_stream
 *
 * Starts with the CSV Table header and then adds all nodes line by line
 *
 * @method _nodes_to_csv
 * @param write_stream {WriteStream}
 * @return {Promise}
 */
Export._nodes_to_csv = function (write_stream) {
    return new Promise(function (resolve, reject) {
        try {
            var session = database._get_session();
            write_stream.write('Node_ID,value,tokenType,groupType\n');
        } catch (e) {
            return reject(e);
        }

        session.run("MATCH (n) RETURN ID(n) as ident, n.value as value, n.tokenType as tokenType, n.groupType as groupType;")
            .subscribe({
                    onNext: function (record) {
                        write_stream.write(record.get('ident').toString() + ',');
                        write_stream.write((record.get('value') ? '"' + encodeURIComponent(record.get('value')) + '"' : 'NULL') + ',');
                        write_stream.write((record.get('tokenType') ? '"' + encodeURIComponent(record.get('tokenType')) + '"' : 'NULL') + ',');
                        write_stream.write((record.get('groupType') ? '"' + encodeURIComponent(record.get('groupType')) + '"' : 'NULL') + '\n');
                    },
                    onCompleted: function () {
                        session.close();
                        return resolve();
                    },
                    onError: function (error) {
                        log.error(error);
                        reject();
                    }
                }
            );
    });
};

/**
 * Writes csv into the given write_stream
 *
 * Starts with the CSV Table header and then adds all relations line by line
 *
 * @method _relations_to_csv
 * @param write_stream {WriteStream}
 * @return {Promise}
 */
Export._relations_to_csv = function (write_stream) {
    return new Promise(function (resolve, reject) {
        try {
            var session = database._get_session();
            write_stream.write('Relation_ID,relationType,SourceNode_ID,TargetNode_ID\n');
        } catch (e) {
            return reject(e);
        }

        session.run("MATCH ()-[r]-() RETURN DISTINCT ID(r) as ident, TYPE(r) as type, ID(STARTNODE(r)) as origin, ID(ENDNODE(r)) as target;")
            .subscribe({
                    onNext: function (record) {
                        write_stream.write(record.get('ident').toString() + ',');
                        write_stream.write((record.get('type') ? '"' + encodeURIComponent(record.get('type')) + '"' : 'NULL') + ',');
                        write_stream.write(record.get('origin').toString() + ',');
                        write_stream.write(record.get('target').toString() + '\n');
                    },
                    onCompleted: function () {
                        session.close();
                        return resolve();
                    },
                    onError: function (error) {
                        log.error(error);
                        reject();
                    }
                }
            );
    });
};

/**
 * Writes csv into the given write_stream
 *
 * Starts with the CSV Table header and then adds all relation_properties line by line
 *
 * @method _relation_properties_to_csv
 * @param write_stream {WriteStream}
 * @return {Promise}
 */
Export._relation_properties_to_csv = function (write_stream) {
    return new Promise(function (resolve, reject) {
        try {
            var session = database._get_session();
            write_stream.write('Relation_ID,key,value\n');
        } catch (e) {
            return reject(e);
        }

        session.run("Match ()-[n]-() return DISTINCT ID(n) as ident, properties(n) as props;")
            .subscribe({
                    onNext: function (record) {
                        var props = record.get('props');
                        Object.keys(props).forEach(function(key) {
                            var value = props[key];
                             write_stream.write(record.get('ident').toString() + ',');
                             write_stream.write((key ? '"' + encodeURIComponent(key) + '"' :  'NULL') + ',');
                             write_stream.write((value ? '"' + encodeURIComponent(value) + '"' :  'NULL') + '\n');
                        });
                    },
                    onCompleted: function () {
                        session.close();
                        return resolve();
                    },
                    onError: function (error) {
                        log.error(error);
                        reject();
                    }
                }
            );
    });
};

/**
 * Writes csv into the given write_stream
 *
 * Starts with the CSV Table header and then adds all _node_properties_to_csv line by line
 *
 * @method _node_properties_to_csv
 * @param write_stream {WriteStream}
 * @return {Promise}
 */
Export._node_properties_to_csv = function (write_stream) {
    return new Promise(function (resolve, reject) {
        try {
            var session = database._get_session();
            write_stream.write('Node_ID,key,value\n');
        } catch (e) {
            return reject(e);
        }

        session.run("Match (n) return DISTINCT ID(n) as ident, properties(n) as props;")
            .subscribe({
                    onNext: function (record) {
                        var props = record.get('props');
                        Object.keys(props).forEach(function(key) {
                            var value = props[key];
                             write_stream.write(record.get('ident').toString() + ',');
                             write_stream.write((key ? '"' + encodeURIComponent(key) + '"' :  'NULL') + ',');
                             write_stream.write((value ? '"' + encodeURIComponent(value) + '"' :  'NULL') + '\n');
                        });
                    },
                    onCompleted: function () {
                        session.close();
                        return resolve();
                    },
                    onError: function (error) {
                        log.error(error);
                        reject();
                    }
                }
            );
    });
};

/**
 * Creates a zipped SQL file containing all of the SQL creation and insertion statements for the DB
 * The file is stored in the to_folder of Export
 *
 *
 * @method to_sql
 * @return {Promise}
 */
Export.to_sql = function () {
    return new Promise(function (resolve, reject) {
        try {
            var time_stamp = Export._get_time();
            var file_name = 'sql-' + time_stamp + '.sql';
            var file_path = path.join(Export.to_folder, file_name);
            var wstream = fs.createWriteStream(file_path);
            return Export._nodes_to_sql(wstream).then(function (data) {
                return Export._relations_to_sql(wstream).then(function (data) {
                    return Export._relation_properties_to_sql(wstream).then(function (data) {
                        return Export._node_properties_to_sql(wstream).then(function(data){
                            wstream.end();
                            var output_path = path.join(Export.to_folder, 'sql-' + time_stamp + '.zip');

                            var output = fs.createWriteStream(output_path);
                            var archive = archiver('zip', {
                                gzip: true,
                                zlib: { level: 9 }
                            });

                            archive.on('error', function(err) {
                              return reject(err);
                            });

                            // pipe archive data to the output file
                            archive.pipe(output);

                            // append files
                            [file_path].forEach(function(file_path){
                                archive.file(file_path, {name: path.basename(file_path)});
                            });
                            // finalize
                            archive.finalize();

                            output.on("close", function(){
                                fs.unlinkSync(file_path);
                                resolve(output_path);
                            });
                        }).catch(function(err){
                            wstream.end();
                            reject(err);
                        });

                    }).catch(function (err) {
                        wstream.end();
                        reject(err);
                    });

                }).catch(function (err) {
                    wstream.end();
                    reject(err);
                });
            }).catch(function (err) {
                wstream.end();
                reject(err);
            });
        } catch (e) {
            reject(e);
        }
    });
};

/**
 * Creates a zipped dir containing four files necessary to reassemble the GraphDB's storage
 * The file is stored in the to_folder of Export
 *
 *
 * @method to_csv
 * @return {Promise}
 */
Export.to_csv = function () {
    var time_stamp = Export._get_time()
    return new Promise(function (resolve, reject) {
        try {
            // nodes file
            var file_name_nodes = 'csv-nodes-' + time_stamp + '.csv';
            var file_path_nodes = path.join(Export.to_folder, file_name_nodes);
            var wstream_nodes = fs.createWriteStream(file_path_nodes);

            // relations file
            var file_name_relations = 'csv-relations-' + time_stamp + '.csv';
            var file_path_relations = path.join(Export.to_folder, file_name_relations);
            var wstream_relations = fs.createWriteStream(file_path_relations);

            // relationprops file
            var file_name_relationprops = 'csv-relationprops-' + time_stamp + '.csv';
            var file_path_relationprops = path.join(Export.to_folder, file_name_relationprops);
            var wstream_relationprops = fs.createWriteStream(file_path_relationprops);

            // nodeprops file
            var file_name_nodeprops = 'csv-nodeprops-' + time_stamp + '.csv';
            var file_path_nodeprops = path.join(Export.to_folder, file_name_nodeprops);
            var wstream_nodeprops = fs.createWriteStream(file_path_nodeprops);

            return Export._nodes_to_csv(wstream_nodes).then(function (data) {
                wstream_nodes.end();
                return Export._relations_to_csv(wstream_relations).then(function (data) {
                    wstream_relations.end();
                    return Export._relation_properties_to_csv(wstream_relationprops).then(function (data) {
                        wstream_relationprops.end();
                        return Export._node_properties_to_csv(wstream_nodeprops).then(function(data){
                            wstream_nodeprops.end();

                            var output_path = path.join(Export.to_folder, time_stamp+'.zip')

                            var output = fs.createWriteStream(output_path);
                            var archive = archiver('zip', {
                                gzip: true,
                                zlib: { level: 9 }
                            });

                            archive.on('error', function(err) {
                              return reject(err);
                            });

                            // pipe archive data to the output file
                            archive.pipe(output);

                            // append files
                            [file_path_nodes, file_path_relations, file_path_relationprops, file_path_nodeprops].forEach(function(file_path){
                                archive.file(file_path, {name: path.basename(file_path)});
                            });
                            // finalize
                            archive.finalize();

                            output.on("close", function(){
                                [file_path_nodes, file_path_relations, file_path_relationprops, file_path_nodeprops].forEach(function(file_path){
                                    fs.unlinkSync(file_path);
                                });
                                resolve(output_path);
                            });
                        }).catch(function(err){
                            wstream_nodeprops.end();
                            reject(err);
                        });

                    }).catch(function (err) {
                        wstream_relationprops.end();
                        reject(err);
                    });

                }).catch(function (err) {
                    wstream_relations.end();
                    reject(err);
                });
            }).catch(function (err) {
                wstream_nodes.end();
                reject(err);
            });
        } catch (e) {
            reject(e);
        }
    });
};

module.exports = Export;