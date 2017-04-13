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
    describe("#Image", function(){
        it.only("save one", function(done) {
            database.add_image(file_path).then(
                function(result) {done();},
                function(err) {
                    console.log(err);
                    done("Error creating Image");
                })
        });
        it.only("get all images and look for ours", function(done) {
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
        it.only("now remove it again", function(done) {
            database.remove_image(file_path).then(
                function(number_of_deleted_nodes) {
                    if (number_of_deleted_nodes > 0) {
                        done();
                    } else {
                        done('No Node was deleted!');
                    }
                },
                function() {done("Error deleting Images");})
        });

    });
});

