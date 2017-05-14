// Test setup
var mocha = require('mocha');
var chai = require('chai');

// To be tested
var about = require('../src/about');

// Activate should-syntax (http://chaijs.com/guide/styles/#should)
chai.should();

describe('about', function() {
	it("Should return the current version number", function() {
		var output = about.get_version();
		output.should.be.a('string');
		// break the test in order to see how travis performs
		output.should.equal('0.0.2');
	});
});

