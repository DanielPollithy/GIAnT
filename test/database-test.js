// Test setup
var mocha = require('mocha');
var chai = require('chai');

// To be tested
var database = require('../src/database');

// Activate should-syntax (http://chaijs.com/guide/styles/#should)
chai.should();

/*describe('database get_all_images', function() {
	it("It should return an empty array", function() {
		var output = database.get_all_images();
		output.should.be.a('array');
		// break the test in order to see how travis performs
		output.should.have.lengthOf(0);
	});
});*/

describe('database', function() {
    var file_path = 'example_filepath.jpeg';
    var fragment_name = 'something stupid';
    describe("#Database", function () {
        it('Setup the constraints', function (done) {
            database.init().then(function(){done();}, function(err){done(err);});
        })
    });
    describe("#Image", function(){
        it("save one", function(done) {
            database.add_image(file_path).then(
                function(result) {done();},
                function(err) {
                    done(err);
                })
        });
        it("get all images and look for ours", function(done) {
            database.get_all_images().then(
                function(records) {
                    var found = false;
                    records.forEach(function (record) {
                        if (record.get('file_path') === file_path) {
                            found = true;
                        }
                    });
                    if (found) {
                        done();
                    } else {
                        done('The image was not found in the result set');
                    }
                },
                function() {done("Error retrieving Images");})
        });
        it("add a fragment to the image", function(done){
            database.get_image(file_path).then(function(record){
                database.add_fragment(record.get('ident'), fragment_name).then(function(){
                        done();
                    }, function(err){
                        done(err);
                    });
            }, function(err){done(err);})

        });


        it("get the fragment", function(done){
            database.get_fragment(file_path, fragment_name).then(function(record){
                if (!record.get('fragment_name') === fragment_name) {
                    done('fragment_name mismatch');
                }
                done();
            }, function(err){
                done(err);
            });
        });
        it("add a node to the fragment", function(done){
            database.add_node(file_path, fragment_name, {id:"1"}).then(function(number_of_created_nodes){
                done();
            }, function(err){
                done(err);
            });
        });
        it("add a second node to the fragment", function(done){
            database.add_node(file_path, fragment_name, {id:"2"}).then(function(number_of_created_nodes){
                done();
            }, function(err){
                done(err);
            });
        });

        it("add en edge between the nodes", function(done){
            database.add_edge(file_path, fragment_name, "1", "2", {id:"3"}).then(function(number_of_created_nodes){
                done();
            }, function(err){
                done(err);
            });
        });
        it("now remove the fragment", function(done){
            database.get_image(file_path).then(function(record){
                database.remove_fragment(record.get('ident'), fragment_name).then(function(record){
                    done();
                }, function(err){
                    done(err);
                });
            }, function(err){done(err);})

        });
        it("now remove the image again", function(done) {
            database.get_image(file_path).then(function(record){
            database.remove_image_by_id(record.get('ident')).then(
                function(number_of_deleted_nodes) {
                    done();
                },
                function() {done("Error deleting Images");})
                }, function(err){done(err);})
        });

    });
});

