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

describe('codec (see xml/Readme.md)', function () {
    describe('#mxgraph_to_object', function () {
        it("load valid 1.xml", function (done) {
            Codec.mxgraph_to_object("../test/xml/1.xml").then(
                function (graph) {
                    done();
                },
                function (err) {
                    done(err);
                }
            );
        });
        it("load non existent file", function (done) {
            Codec.mxgraph_to_object("XXXXXXXXXXXXXXX.xml").then(
                function (graph) {
                    done('There should have been an error loading that file');
                },
                function (err) {
                    done();
                }
            );
        });
        it("load non-xml file", function (done) {
            Codec.mxgraph_to_object('../test/about-test.js').then(
                function (graph) {
                    done('There should have been an error loading that file');
                },
                function (err) {
                    done();
                });
        });
    });
});

describe('#mxgraph_to_layered_object', function () {

    // 1.XML
    it('count root, rootcell nodes and nodes in 1.xml', function (done) {
        Codec.mxgraph_to_layered_object("../test/xml/1.xml").then(
            function (graph) {
                // there should only be one <root>
                graph.mxGraphModel.root.should.have.lengthOf(1);
                // there is one top cell under the root
                graph.mxGraphModel.root[0].mxCell.should.have.lengthOf(1);
                graph.mxGraphModel.root[0].mxCell[0].children.should.have.lengthOf(2);
                graph.mxGraphModel.root[0].mxCell[0].children[0].$.id.should.equal('1');
                graph.mxGraphModel.root[0].mxCell[0].children[1].$.id.should.equal('2');
                graph.mxGraphModel.root[0].mxCell[0].children[1].children.should.have.lengthOf(1);
                graph.mxGraphModel.root[0].mxCell[0].children[1].children[0].$.id.should.equal('3');
                done();
            },
            done
        );
    });

    // 2.XML
    it('count root, rootcell nodes and nodes in 2.xml', function (done) {
        Codec.mxgraph_to_layered_object("../test/xml/2.xml").then(
            function (graph) {
                // there should only be one <root>
                graph.mxGraphModel.root.should.have.lengthOf(1);
                // there is one top cell under the root
                graph.mxGraphModel.root[0].mxCell.should.have.lengthOf(1);
                // there are three layers (2+background)
                graph.mxGraphModel.root[0].mxCell[0].children.should.have.lengthOf(3);
                var base = graph.mxGraphModel.root[0].mxCell[0];
                for (var i = 0; i < base.children.length; i++) {
                    if (base.children[i].$.id === '2' || base.children[i].$.id === '3') {
                        base.children[i].children.should.have.lengthOf(2);
                    }
                }
                done();
            },
            done
        );
    });

    // 3.XML
    it('Get the 6 attributes from the object in 3.xml', function (done) {
        Codec.mxgraph_to_layered_object("../test/xml/3.xml").then(
            function (graph) {
                // there should only be one <root>
                graph.mxGraphModel.root.should.have.lengthOf(1);
                // there is one top cell under the root
                graph.mxGraphModel.root[0].mxCell.should.have.lengthOf(1);
                // there are two layers (1+background)
                graph.mxGraphModel.root[0].mxCell[0].children.should.have.lengthOf(2);
                graph.mxGraphModel.root[0].mxCell[0].children[1].children.should.have.lengthOf(1);
                var node = graph.mxGraphModel.root[0].mxCell[0].children[1].children[0];
                var attrs = ['label', 'color', 'dialect', 'lang', 'pos', 'them_mak', 'tool', 'id', 'style', 'parent', 'vertex'];
                attrs.forEach(function (attr) {
                    node.$.should.have.property(attr);
                });
                done();
            }, done);
    });

    // 4.XML
    it('Remove the group in 4.xml', function (done) {
        Codec.mxgraph_to_layered_object("../test/xml/4.xml").then(function (graph) {
            // there should only be one <root>
            graph.mxGraphModel.root.should.have.lengthOf(1);
            // there is one top cell under the root
            graph.mxGraphModel.root[0].mxCell.should.have.lengthOf(1);
            // there are two layers (1+background)
            graph.mxGraphModel.root[0].mxCell[0].children.should.have.lengthOf(2);
            // there should be three nodes directly under the second layer
            // because the group should be deleted
            graph.mxGraphModel.root[0].mxCell[0].children[1].children.should.have.lengthOf(3);

            done();
        }, done);
    });

    // 5.XML
    it('Remove the groups in 5.xml', function (done) {
        Codec.mxgraph_to_layered_object("../test/xml/5.xml").then(function (graph) {
            // there should only be one <root>
            graph.mxGraphModel.root.should.have.lengthOf(1);
            // there is one top cell under the root
            graph.mxGraphModel.root[0].mxCell.should.have.lengthOf(1);
            // there are two layers (1+background)
            graph.mxGraphModel.root[0].mxCell[0].children.should.have.lengthOf(2);
            // there should be four nodes directly under the second layer
            // because both groups should have been deleted
            graph.mxGraphModel.root[0].mxCell[0].children[1].children.should.have.lengthOf(4);

            done();
        }, done);
    });

    // 6.XML
    it('6.xml contains 1 edge', function (done) {
        Codec.mxgraph_to_layered_object("../test/xml/6.xml").then(function (graph) {
            // there should only be one <root>
            graph.mxGraphModel.root.should.have.lengthOf(1);
            // there is one top cell under the root
            graph.mxGraphModel.root[0].mxCell.should.have.lengthOf(1);
            // there are two layers (1+background)
            graph.mxGraphModel.root[0].mxCell[0].children.should.have.lengthOf(2);
            // there should be three nodes directly under the second layer
            graph.mxGraphModel.root[0].mxCell[0].children[1].children.should.have.lengthOf(3);
            // one of these should have the attribute edge="1"
            var count = 0;
            graph.mxGraphModel.root[0].mxCell[0].children[1].children.forEach(function (c) {
                if (c.$.edge && c.$.edge === '1') {
                    count++;
                }
            });
            // only one!
            count.should.equal(1);

            done();
        }, done);
    });

    // 7.XML
    it('7.xml contains 2 edges', function (done) {
        Codec.mxgraph_to_layered_object("../test/xml/7.xml").then(function (graph) {
            // there should only be one <root>
            graph.mxGraphModel.root.should.have.lengthOf(1);
            // there is one top cell under the root
            graph.mxGraphModel.root[0].mxCell.should.have.lengthOf(1);
            // there are two layers (1+background)
            graph.mxGraphModel.root[0].mxCell[0].children.should.have.lengthOf(2);
            // there should be five nodes directly under the second layer
            graph.mxGraphModel.root[0].mxCell[0].children[1].children.should.have.lengthOf(5);
            // two of them should have the attribute edge="1"
            var count = 0;
            graph.mxGraphModel.root[0].mxCell[0].children[1].children.forEach(function (c) {
                if (c.$.edge && c.$.edge === '1') {
                    count++;
                }
            });

            count.should.equal(2);

            done();
        }, done);
    });
});

describe('# mxgraph_to_flattened_object', function () {
    // Flattened
    it('Flattened 7.xml and found 2 edges', function (done) {
        Codec.mxgraph_to_flattened_object("../test/xml/7.xml").then(function (graph) {
            // there should only be one <root>
            graph.mxGraphModel.data.should.have.lengthOf(5);
            // there should be two edges
            var count = 0;
            graph.mxGraphModel.data.forEach(function (c) {
                if (c.$.edge && c.$.edge === '1') {
                    count++;
                }
            });
            count.should.equal(2);

            done();
        }, done);
    });

    // Flattened 8.xml
    it('Big Flattened 8.xml with 14 edges and 10 tokens', function (done) {
        Codec.mxgraph_to_flattened_object("../test/xml/8.xml").then(function (graph) {
            // there should only be one <root>
            graph.mxGraphModel.data.should.have.lengthOf(14 + 10);
            // there should be two edges
            var count = 0;
            graph.mxGraphModel.data.forEach(function (c) {
                if (c.$.edge && c.$.edge === '1') {
                    count++;
                }
            });
            count.should.equal(14);

            done();
        }, done);
    });
});

describe('# mxgraph_to_graphml', function () {
    it('1.xml', function (done) {
        Codec.mxgraph_to_graphml("../test/xml/1.xml").then(function (graphml) {
            done();
        }, done);
    });

    it('2.xml', function (done) {
        Codec.mxgraph_to_graphml("../test/xml/2.xml").then(function (graphml) {
            done();
        }, done);
    });

    it('3.xml', function (done) {
        Codec.mxgraph_to_graphml("../test/xml/3.xml").then(function (graphml) {
            done();
        }, done);
    });

    it('4.xml', function (done) {
        Codec.mxgraph_to_graphml("../test/xml/4.xml").then(function (graphml) {
            done();
        }, done);
    });

    it('5.xml', function (done) {
        Codec.mxgraph_to_graphml("../test/xml/5.xml").then(function (graphml) {
            done();
        }, done);
    });

    it('6.xml', function (done) {
        Codec.mxgraph_to_graphml("../test/xml/6.xml").then(function (graphml) {
            done();
        }, done);
    });

    it('7.xml', function (done) {
        Codec.mxgraph_to_graphml("../test/xml/7.xml").then(function (graphml) {
            done();
        }, done);
    });
    
    it('8.xml', function (done) {
        Codec.mxgraph_to_graphml("../test/xml/8.xml").then(function (graphml) {
            done();
        }, done);
    });
});