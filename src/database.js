var neo4j = require('neo4j-driver').v1;
//var config = require('../config.json');

// Todo: Move this to the environment variables
var development = false;

function get_driver() {
    if (development) {
        return neo4j.driver("bolt://localhost:7687");
    }
    return neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "1234"));

}

function get_session() {
    return get_driver().session();
}

function add_image(file_path) {
    var session = get_session();
    var d = new Date();
    var upload_date = Math.round(d.getTime() / 1000);
    var prom = session.run("CREATE (a:Image {file_path: {file_path}, upload_date: {upload_date}, completed:false})",
        {file_path: file_path, upload_date: upload_date});
    return prom;
}

// TODO: Delete all attached Tokens
function remove_image(file_path) {
    var session = get_session();
    var prom = session
        .run("MATCH (n:Image {file_path: {file_path}}) DELETE n",
            {file_path: file_path})
        .then(function (result) {
            session.close();
            var number_of_deleted_nodes = result.summary.updateStatistics._stats.nodesDeleted;
            return number_of_deleted_nodes;
        });
    return prom;
}

function remove_image_by_id(id_) {
    var session = get_session();
    var prom = session
        .run("MATCH (n:Image) WHERE ID(n) = {ident} DELETE n", {ident: Number(id_)})
        .then(function (result) {
            session.close();
            var number_of_deleted_nodes = result.summary.updateStatistics._stats.nodesDeleted;
            return number_of_deleted_nodes;
        });
    return prom;
}


// TODO: add pagination
function get_all_images() {
    var session = get_session();
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
}

module.exports.add_image = add_image;
module.exports.get_all_images = get_all_images;
module.exports.remove_image = remove_image;
module.exports.remove_image_by_id = remove_image_by_id;