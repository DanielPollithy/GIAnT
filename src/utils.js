var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

var javascript_demo_constraint = "// session = a neo4j session\n" +
"// session.run(cypher_string) returns a promise (see the docs)\n" +
"new Promise(function(resolve, reject){\n" +
"    var variables = {\"fragment_id\": fragment_id};\n" +
"    session.run(\"MATCH(f:Fragment)-[]-(t:Token {value: 'Token'}) WHERE ID(f) = {fragment_id} RETURN t.value as value;\", variables)\n" +
"        .then(function(result){ \n" +
"            var value;\n" +
"            result.records.forEach(function(res){\n" +
"                value = res.get('value');\n" +
"                if (value === \"Token\") {\n" +
"                    reject(\"There was a token called Token.\");\n" +
"                }\n" +
"            });\n" +
"            resolve();\n" +
"    }).catch(function(err){\n" +
"        reject(err);\n" +
"    });\n" +
"});\n";

function hash_of_file_content(file_path) {
    try {
        var data = fs.readFileSync(__dirname + '/' + file_path);
        return crypto.createHash('sha1').update(data.toString()).digest('hex').toString();
    } catch (e) {
        return null;
    }
}

function hash_xml_fragment (fragment_id) {
    return hash_of_file_content('../media/uploaded_xmls/' + fragment_id + '.xml');
}

function remove_image(file_path) {
    return fs.unlinkSync(path.join(__dirname, '..', 'media', 'uploaded_images', file_path));
}

function token_type_mapping(token_type) {
    if (token_type === 'token') {
        return 'Token';
    }
    if (token_type === 'frame' || token_type === 'comment' || token_type === 'blanco') {
        return 'Group';
    }
    return null;
}
/**
 * chains a list of functions (that return promises) and executes them in the right order
 * [function() {return Promise.resolve();}, function() {return Promise.resolve();}]
 *
 * @param funcs is an array of functions returning promises
 * @returns {Promise}
 */
function chain_promises(funcs) {
    if (funcs.length < 1) {
        return Promise.resolve();
    }
    var i = 0;
    return chain_executor(funcs, i);
}

/**
 * Recursive help method for chain_promises
 * 1) executes a function that returns a promise (no params allowed)
 * 2) chains itself to the success resolve of the promise
 *
 * @param funcs is an array of functions returning promises
 * @param i is the current working index
 */
function chain_executor(funcs, i) {
    var promise = funcs[i]();
    return promise.then(function(){
        console.log(i);
        if (funcs.length > i+1) {
            return chain_executor(funcs, i+1);
        } else {
            return Promise.resolve();
        }
    })
}

module.exports = {
    'javascript_demo_constraint':javascript_demo_constraint,
    'hash_of_file_content': hash_of_file_content,
    'hash_xml_fragment': hash_xml_fragment,
    'remove_image': remove_image,
    'token_type_mapping': token_type_mapping,
    'chain_promises': chain_promises
};
