// Test setup
var mocha = require('mocha');
var chai = require('chai');

// To be tested
var utils = require('../src/utils');
var path = require('path');

var database = require('../src/database');
database.login('bolt://localhost:7687', 'neo4j', '1234');

// Activate should-syntax (http://chaijs.com/guide/styles/#should)
chai.should();

describe('utils', function() {
    describe('#extract exif from jpeg', function () {
        console.log(__dirname);
        it("load png", function (done) {
            utils.get_exif_from_image(path.join(__dirname, "/exif/png.png"), function(err, data) {
                if (err) {
                    if (err === "The given image is not a JPEG and thus unsupported right now.") {
                        done();
                    } else {
                        done(err);
                    }
                } else {
                    done('There should have been an error');
                }
            });
        });

        it("load empty jpg", function (done) {
            utils.get_exif_from_image(path.join(__dirname, "exif/empty.jpg"), function(err, data) {
                if (err) {
                    if (err === "No Exif segment found in the given image.") {
                        done();
                    } else {
                        done(err);
                    }
                } else {
                    done('there should have been an error');
                }
            });
        });

        it("load valid exif gps", function (done) {
            utils.get_exif_from_image(path.join(__dirname, "exif/test.jpg"), function(err, data) {
                if (err) {
                    done(err);
                } else {
                    if (!data.hasOwnProperty('gps')) {
                        done('missing key gps');
                    } else {
                        var keys = ['GPSLatitude', 'GPSLatitudeRef', 'GPSLongitudeRef', 'GPSLongitude'];
                        keys.forEach(function(key){
                            if (!data.gps.hasOwnProperty(key)) {
                                done('Missing key '+ key);
                            }
                        });
                        done();
                    }
                }
            });
        });

        it("add valid exif to image", function (done) {
            utils.get_exif_from_image(path.join(__dirname, "exif/test.jpg"), function(err, data) {
                if (err) {
                    done(err);
                }
                database.add_image("test9999.jpg", data).then(function (record) {
                    var image_id = record['ident'];
                    database.get_image("test9999.jpg").then(function(record){
                        record = record.get('a').properties;
                        console.dir(record);
                        var lat = record['GPSLatitude'];
                        var long = record['GPSLongitude'];
                        var latRef = record['GPSLatitudeRef'];
                        var longRef = record['GPSLongitudeRef'];
                        var coords = [lat, long, latRef, longRef];
                        coords.forEach(function(coord){
                            if (coord === undefined) {
                                database.remove_image_by_id(image_id).then(function(){
                                    done('Missing gps data in the database');
                                }, done);

                            }
                        });
                        database.remove_image_by_id(image_id).then(function(){
                            done();
                        }, done);

                    }, done);
                }, function(err){
                    done(err);
                });
            });
        });
    });
});