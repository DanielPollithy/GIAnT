// Test setup
var mocha = require('mocha');
var chai = require('chai');

// To be tested
var Codec = require('../src/codec');

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

describe('codec', function() {
    console.log(__dirname)
    var file_path = "../test/xml/1.xml";
    describe('#Load', function () {
        it.only("load valid 1.xml", function (done) {
            Codec.mxgraph_to_object(file_path, function(err, graph) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
        });
        it.only("load non existent file", function (done) {
            Codec.mxgraph_to_object("xxxxxxxxxxxxxxxx.xml", function(err, graph) {
                if (err) {
                    done();
                } else {
                    done('There should have been an error loading not existent file xxxxxxxxxxxxxxxx.xml');
                }
            });
        });
        it.only("load not xml file", function (done) {
            Codec.mxgraph_to_object('about-test.js', function(err, graph) {
                if (err) {
                    done();
                } else {
                    done('There should have been an error loading not xml file about-test.js');
                }
            });
        });
    })
});