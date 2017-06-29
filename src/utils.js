var crypto = require('crypto');
var fs = require('fs');

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


module.exports = {
    'javascript_demo_constraint':javascript_demo_constraint,
    'hash_of_file_content':hash_of_file_content,
    'hash_xml_fragment':hash_xml_fragment
};
