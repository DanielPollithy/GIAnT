// Test setup
var mocha = require('mocha');
var chai = require('chai');

var database = require('../src/database');
database.login('bolt://localhost:7687', 'neo4j', '1234');

// To be tested
var utils = require('../src/utils');
var exif_utils = require('../src/exif_utils');
var heatmap = require('../src/heatmap');
var path = require('path');



// Activate should-syntax (http://chaijs.com/guide/styles/#should)
chai.should();

describe('utils', function() {
    describe('#extract exif from jpeg', function () {
        console.log(__dirname);
        it("load png", function (done) {
            exif_utils.get_exif_from_image(path.join(__dirname, "/exif/png.png"), function(err, data) {
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
            exif_utils.get_exif_from_image(path.join(__dirname, "exif/empty.jpg"), function(err, data) {
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
            exif_utils.get_exif_from_image(path.join(__dirname, "exif/test.jpg"), function(err, data) {
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
            exif_utils.get_exif_from_image(path.join(__dirname, "exif/test.jpg"), function(err, data) {
                if (err) {
                    done(err);
                }
                database.add_image("test9999.jpg", data).then(function () {
                    database.get_image("test9999.jpg").then(function(record){
                        var image_id = record.get('ident');
                        record = record.get('a').properties;
                        var lat = record['GPSLatitude'];
                        var long = record['GPSLongitude'];
                        var latRef = record['GPSLatitudeRef'];
                        var longRef = record['GPSLongitudeRef'];
                        var coords = [lat, long, latRef, longRef];
                        var missing = false;
                        coords.forEach(function(coord){
                            if (coord === undefined) {
                                missing = true;
                            }
                        });
                        if (missing) {
                            database.remove_image_by_id(image_id).then(function(){
                                done('Missing gps data in the database');
                            }, done);
                        } else {
                            database.remove_image_by_id(image_id).then(function(){
                                // DON'T REMOVE THIS LOG
                                console.log(image_id);
                                done();
                            }, done);
                        }
                    }, done);
                }, function(err){
                    done(err);
                });
            });
        });


        it("extract creation date from exif", function (done) {
            exif_utils.get_exif_from_image(path.join(__dirname, "exif/date.jpg"), function(err, data) {
                if (err) {
                    done(err);
                }
                database.add_image("test_x.jpg", data).then(function () {
                    database.get_image("test_x.jpg").then(function(record){
                        var image_id = record.get('ident');
                        record = record.get('a').properties;
                        var creation_date = record['upload_date'];
                        console.log(creation_date);
                        var wrong = true;
                        if (Number(creation_date) === 1483244880000) {
                            wrong = false;
                        }
                        if (wrong) {
                            database.remove_image_by_id(image_id).then(function(){
                                done('Created image with exif date tag has the wrong milliseconds since 1970');
                            }, done);
                        } else {
                            database.remove_image_by_id(image_id).then(function(){
                                // DON'T REMOVE THIS LOG
                                console.log(image_id);
                                done();
                            }, done);
                        }
                    }, done);
                }, function(err){
                    done(err);
                });
            });
        });
    });
    describe('#parse the heatmap result', function () {
        it("check number of records in heatmap", function (done) {
            database.add_image('xyz').then(
                function(result){
                    var image_id = Number(result.get('ident'));
                    var session = database._get_session();
                    session.run('MATCH (i:Image) RETURN i;').then(
                        function(data) {
                            var records = [];
                            for (var i = 0; i < data.records.length; i++) {
                                records.push(data.records[i]);
                            }
                            var n = heatmap.count_images_in_result(records);
                            database.remove_image_by_id(image_id).then(
                                function() {
                                    if (n !== 1) {
                                        done('n should be 1');
                                    } else {
                                        done();
                                    }
                                },
                                function(err){
                                    done(err);
                                }
                            )
                        },
                        function(err) {
                            database.remove_image_by_id(image_id).then(
                                function() {
                                    done(err);
                                },
                                function(err2){
                                    done(err);
                                }
                            )
                        }
                    );
                },
                function(err){
                    done(err);
                }
            );
        });
    });
});