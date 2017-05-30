/**
 * Created by daniel on 19.05.17.
 */

var ExifImage = require('exif').ExifImage;
var database = require('./database');

function get_exif_from_image(path, cb) {
    try {
        new ExifImage({image: path}, function (error, exifData) {
            if (error) {
                cb(error.message);
            }
            else {
                cb(null, exifData);
            }
        });
    } catch (error) {
        console.log('Error: ' + error.message);
    }
}

function count_entities_by_label(records, label) {
    var i = 0;
    records.forEach(function(record){
        if (record._fields[0].labels.includes(label)) {
            i++;
        }
    });
    return i;
}

function count_images_in_result(result) {
    return count_entities_by_label(result, "Image");
}

function count_fragments_in_result(result) {
    return count_entities_by_label(result, "Fragment");
}

function count_tokens_in_result(result) {
    return count_entities_by_label(result, "Token");
}

function assure_node_has_property(node, property_name) {
    return node._fields[0].properties.hasOwnProperty(property_name);
}

function assure_node_has_properties(node, property_names) {
    property_names.forEach(function(prop){
        if (!assure_node_has_property(node, prop)) {
            return false;
        }
    });
    return true;
}

function check_all_tokens_are_spatial(records) {
    var mandatory = ['x', 'y', 'width', 'height'];
    records.forEach(function(record){
        if (record._fields[0].labels.includes('Token')) {
            if (!assure_node_has_properties(record, mandatory)) {
                return false;
            }
        }
    });
    return true;
}

function check_all_images_have_dimension(records) {
    var mandatory = ['width', 'height'];
    records.forEach(function(record){
        if (record._fields[0].labels.includes('Image')) {
            if (!assure_node_has_properties(record, mandatory)) {
                return false;
            }
        }
    });
    return true;
}

// TODO: implement different normalization techniques
function normalize_token_spatials(token, normalization, target_width, target_height) {
    var token_id = Number(token._fields[0].identity);
    return database.get_image_of_token(token_id).then(function(img){
        // TODO: Check if image has width and height
        var image_width = img._fields[0].properties.width;
        var image_height = img._fields[0].properties.height;
        var width_ratio = image_width / target_width;
        var height_ratio = image_height / target_height;
        var x = Number(token._fields[0].properties.x);
        var y = Number(token._fields[0].properties.y);
        var width = Number(token._fields[0].properties.width);
        var height = Number(token._fields[0].properties.height);
        var normalized = {
            'x': Math.round(x / width_ratio),
            'y': Math.round(y / height_ratio),
            'width': Math.round(width / width_ratio),
            'height': Math.round(height / height_ratio)
        };
        return normalized;
    }, function(err){
        return 'No image found for the given token';
    });

}

function normalize_heatmap_nodes(records, normalization, width, height) {
    var p = new Promise(function(resolve, reject) {
        var heat_map = new Array(width);
        for (var i = 0; i < width; i++) {
          heat_map[i] = new Array(height);
          for (var z = heat_map[i].length-1; z >= 0; -- z) {heat_map[i][z] = 0;}
        }

        var all_promises = [];

        records.forEach(function(record) {
            all_promises.push(normalize_token_spatials(record, normalization, width, height));
        });

        Promise.all(all_promises).then(
            function(all_results){
                var count = 0;
                var max = 0;
                all_results.forEach(function(normalized){
                    count++;
                    // calcalute all point spanned by the rects x,y,width,height
                    for (var x_ = normalized.x; x_ < normalized.x + normalized.width; x_++) {
                        for (var y_ = normalized.y; y_ < normalized.y + normalized.height; y_++) {
                            heat_map[x_][y_]++;
                            // calculate the maximum entry in the matrix on the last iteration
                            if (count === all_results.length && heat_map[x_][y_] > max) {
                                max = heat_map[x_][y_];
                            }
                        }
                    }
                });
                for (var x = 0; x < heat_map.length; x++) {
                    for (var y = 0; y < heat_map[0].length; y++) {
                        heat_map[x][y] = heat_map[x][y] / max;
                    }
                }
                resolve(heat_map);
            },
            function(err){
                reject(err);
            }
        );
    });
    return p;
}

function format_heat_map_to_d3js(heat_map) {
    /*var data = [
        {score: 0.5, row: 0, col: 0},
        {score: 0.7, row: 0, col: 1},
        {score: 0.2, row: 1, col: 0},
        {score: 0.4, row: 1, col: 1}
    ];*/
    var data = [];
    for (var x = 0; x < heat_map.length; x++) {
        for (var y = 0; y < heat_map[0].length; y++) {
            data.push(
                {
                    'score': heat_map[x][y],
                    'row': x,
                    'col': y
                }
            );
        }
    }
    return data;
}

// shall return number of nodes, fragments, images and the normalized data array
// TODO: set maximum size of heatmap
// TODO: define normalization types
MAX_SIZE_HEATMAP = 300;
MAX_PIXEL_SIZE = 5;
function process_heatmap_query(query, normalization, width, height, pixel_size) {
    var p = new Promise(function(resolve, reject) {
        if (width < 1 || width > MAX_SIZE_HEATMAP || height < 1 || height > MAX_SIZE_HEATMAP) {
            return reject('Dimension of heat map are not in between 1 and ' + MAX_SIZE_HEATMAP);
        }
        if (normalization !== 1) {
            return reject('Unsupported normalization');
        }
        if (pixel_size < 1 || pixel_size > 5) {
            return reject('Wrong pixel_size');
        }
        // get the query result
        var session = database._get_session();
        session.run(query).then(
            function(result){
                session.close();
                var records = [];
                for (var i = 0; i < result.records.length; i++) {
                    records.push(result.records[i]);
                }
                // counts
                var num_images = count_images_in_result(records);
                var num_fragments = count_fragments_in_result(records);
                var num_tokens = count_tokens_in_result(records);

                if (num_tokens === 0) {
                    return reject('Zero tokens found by query');
                }

                // is there a token without the position coordinates?
                // that means we have to check whether every token has the following attributes
                // x,y,width,height
                var all_tokens_are_spatial = check_all_tokens_are_spatial(records);
                if (!all_tokens_are_spatial) {
                    return reject('not all tokens are spatial (have x, y, width and height property)');
                }

                // check if all images have a width and height attribute
                var all_images_have_dimensions = check_all_images_have_dimension(records);
                if (!all_images_have_dimensions) {
                    return reject('not all images have dimensions (have width and height property)');
                }

                normalize_heatmap_nodes(records, normalization, width, height).then(function(heat_map) {
                    var d3js_heat_map = format_heat_map_to_d3js(heat_map);
                    return resolve({
                        'num_images': num_images,
                        'num_fragments': num_fragments,
                        'num_tokens': num_tokens,
                        'heat_map': d3js_heat_map
                    });
                }, function(err){
                    return reject(err);
                });
            },
            function(err){
                console.log(err);
                session.close();
                return reject(err);
            }
        );
    });
    return p;
}

var all = {
    'get_exif_from_image': get_exif_from_image,
    'process_heatmap_query': process_heatmap_query,
    'count_images_in_result': count_images_in_result,
    'count_fragments_in_result': count_fragments_in_result,
    'count_tokens_in_result': count_tokens_in_result
};

module.exports = all;
