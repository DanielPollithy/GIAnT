/**
* Wrapper for the EXIF methods
*
* @class Exif
*/


var log = require('electron-log');
var ExifImage = require('exif').ExifImage;

/**
 * This is a wrapper for the ExifImage object by the third party library exif
 *
 * @method get_exif_from_image
 * @param path {string} Path to the file
 * @param cb {function} the callback
 */
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
        log.error('Error: ' + error.message);
    }
}


module.exports = {
    'get_exif_from_image': get_exif_from_image
};