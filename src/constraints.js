/**
* The constraints are used to check the data integrity in the Neo4J database.
* <br>
* There are: <br>
*  1) Count constraints
*  2) Bool constraints
*  3) Free javascript constraints
*
* @class Constraints
*/
var database = require('./database');


/**
 * Checks bool, count and free constraints
 * If one fails, the promise is rejected and contains the rejected_constraint
 *
 * A constraint is an object with different attributes
 * example attributes: query, min, max, code
 * but also: error, error_code
 *
 * @method check_all_fragments
 * @param bool_constraints {array}
 * @param count_constraints {array}
 * @param free_constraints {array}
 * @return {Promise}
 */
function check_all_fragments(bool_constraints, count_constraints, free_constraints){
    return new Promise(function(resolve, reject) {
        database.get_all_fragments().then(function(fragment_ids){
            var all_promises = [];
            fragment_ids.forEach(function(fragment_id){
                bool_constraints.forEach(function(bool_constraint){
                    all_promises.push(run_bool_constraint(bool_constraint, fragment_id));
                });
                count_constraints.forEach(function(count_constraint){
                    all_promises.push(run_count_constraint(count_constraint, fragment_id));
                });
                free_constraints.forEach(function(free_constraint){
                    all_promises.push(run_free_constraint(free_constraint, fragment_id));
                });
            });
            return Promise.all(all_promises).then(function(all){
                return resolve();
            }, function(rejected_constraint){
                return reject(rejected_constraint);
            });
        });
    });
}


/**
 * Counts the number of results retrieved from the database and compares it to given boundaries
 *
 * Necessary attributes of the constraint: query, min, max
 *
 * Example query: <pre>MATCH(f:Fragment)-[]-(t:Token) WHERE ID(f) = {fragment_id} RETURN t</pre>
 *
 * @method run_count_constraint
 * @param constraint
 * @param fragment_id {Number}
 * @return {Promise}
 */
function run_count_constraint(constraint, fragment_id) {
    var session = database._get_session();
    return new Promise(function(resolve, reject){
        session.run(constraint.query, {'fragment_id':fragment_id}).then(function(res){
            try {
                var num_records = res.records.length;
                if (constraint.min && num_records < constraint.min) {
                    constraint.error = 'Minimum deceeded.';
                    constraint.error_fragment = fragment_id;
                    return reject(constraint);
                }
                if (constraint.max && num_records >= constraint.max) {
                    constraint.error = 'Maximum exceeded.';
                    constraint.error_fragment = fragment_id;
                    return reject(constraint);
                }
                return resolve();
            } catch(err) {
                constraint.error = 'Could not access result set.';
                constraint.error_fragment = fragment_id;
                reject(constraint);
            }
        }).catch(function() {
            constraint.error = 'Cypher query execution failed.';
            constraint.error_fragment = fragment_id;
            reject(constraint);
        });
    });

}


/**
 * Compares the output of the constraint's cypher query to the boolean 'true'
 *
 * Necessary attribute of the constraint: query
 *
 * Example query: <pre>MATCH(f:Fragment)-[]-(t:Token {value: 'Token'}) WHERE ID(f) = {fragment_id} RETURN COUNT(t) > 0;</pre>
 *
 * @method run_bool_constraint
 * @param constraint
 * @param fragment_id {Number}
 * @return {Promise}
 */
function run_bool_constraint(constraint, fragment_id) {
    var session = database._get_session();
    return new Promise(function(resolve, reject){
        session.run(constraint.query, {'fragment_id':fragment_id}).then(function(res){
            try {
                if (res.records[0]['_fields'][0] === true) {
                    resolve();
                } else {
                    constraint.error = 'Evaluated to false.';
                    constraint.error_fragment = fragment_id;
                    reject(constraint);
                }
            } catch(err) {
                constraint.error = 'Could not access first result.';
                constraint.error_fragment = fragment_id;
                reject(constraint);
            }
        }).catch(function() {
            constraint.error = 'Cypher query execution failed.';
            constraint.error_fragment = fragment_id;
            reject(constraint);
        });
    });

}


/**
 * Runs javascript code that has to return a new Promise(...)
 * If it resolves then the constraint is fulfilled
 *
 * Necessary attribute of the constraint: query
 *
 * Example query: <pre>// session = a neo4j session\r\n// session.run(cypher_string) returns a promise (see the docs)\r\nnew Promise(function(resolve, reject){\r\n    var variables = {\"fragment_id\": fragment_id};\r\n    session.run(\"MATCH(f:Fragment)-[]-(t:Token {value: 'Token'}) WHERE ID(f) = {fragment_id} RETURN t.value as value;\", variables)\r\n        .then(function(result){ \r\n            var value;\r\n            result.records.forEach(function(res){\r\n                value = res.get('value');\r\n                if (value === \"Token2\") {\r\n                    reject(\"There was a token called Token.\");\r\n                }\r\n            });\r\n            resolve();\r\n    }).catch(function(err){\r\n        reject(err);\r\n    });\r\n});</pre>
 *
 * @method run_bool_constraint
 * @param constraint
 * @param fragment_id {Number}
 * @return {Promise}
 */
function run_free_constraint(constraint, fragment_id) {
    var session = database._get_session();
    return new Promise(function(resolve, reject) {
        try {
            var promise = eval(constraint.query);
        } catch (e) {
            constraint.error = 'Code error: ' + e;
            constraint.error_fragment = fragment_id;
            return reject(constraint);
        }
        var isPromise = typeof promise.then == 'function';
        if (!isPromise) {
            constraint.error = 'Code does not return a new Promise.'
            constraint.error_fragment = fragment_id;
            return reject(constraint);
        }
        promise.then(resolve).catch(function(err){
            constraint.error = 'Promise failed: ' + err;
            constraint.error_fragment = fragment_id;
            return reject(constraint);
        });
    });
}

/**
 * Compares a new constraint to a saved constraint in order to detect whether changes were made
 *
 * Example query: <pre>// session = a neo4j session\r\n// session.run(cypher_string) returns a promise (see the docs)\r\nnew Promise(function(resolve, reject){\r\n    var variables = {\"fragment_id\": fragment_id};\r\n    session.run(\"MATCH(f:Fragment)-[]-(t:Token {value: 'Token'}) WHERE ID(f) = {fragment_id} RETURN t.value as value;\", variables)\r\n        .then(function(result){ \r\n            var value;\r\n            result.records.forEach(function(res){\r\n                value = res.get('value');\r\n                if (value === \"Token2\") {\r\n                    reject(\"There was a token called Token.\");\r\n                }\r\n            });\r\n            resolve();\r\n    }).catch(function(err){\r\n        reject(err);\r\n    });\r\n});</pre>
 *
 * @method constraint_has_changes
 * @param constraint
 * @param constraint_type {string} either count_constraint, bool_constraint or free_constraint
 * @param fragment_id {Number}
 * @return {Promise}
 */
function constraint_has_changes(constraint, constraint_type, all_constraints) {
    var found = false;
    all_constraints[constraint_type].forEach(function(old_constraint){
        if (Number(old_constraint.id) === Number(constraint.id)) {
            if (old_constraint.query !== constraint.query) {
                found = true;
                return;
            }
            if (constraint_type === 'count_constraint') {
                if (old_constraint.min !== constraint.min || old_constraint.max !== constraint.max) {
                    found = true;
                    return;
                }
            }
        }
    });
    return found;
}

module.exports = {
    'constraint_has_changes': constraint_has_changes,
    'check_all_fragments': check_all_fragments
};