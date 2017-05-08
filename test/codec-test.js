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
    describe('#Load', function () {
        it("load valid 1.xml", function (done) {
            Codec.mxgraph_to_object("../test/xml/1.xml", function(err, graph) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
        });
        it("load non existent file", function (done) {
            Codec.mxgraph_to_object("xxxxxxxxxxxxxxxx.xml", function(err, graph) {
                if (err) {
                    done();
                } else {
                    done('There should have been an error loading not existent file xxxxxxxxxxxxxxxx.xml');
                }
            });
        });
        it("load non-xml file", function (done) {
            Codec.mxgraph_to_object('../test/about-test.js', function(err, graph) {
                if (err) {
                    done();
                } else {
                    done('There should have been an error loading not xml file about-test.js');
                }
            });
        });
    });

    //describe('#');
});