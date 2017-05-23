/**
 * Created by daniel on 19.05.17.
 */

var ExifImage = require('exif').ExifImage;

function get_exif_from_image(path, cb) {
    var data = {};
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

var all = {
    'get_exif_from_image': get_exif_from_image
};

module.exports = all;
