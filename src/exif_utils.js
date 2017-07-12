var log = require('electron-log');
var ExifImage = require('exif').ExifImage;

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