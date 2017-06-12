// Test setup
var mocha = require('mocha');
var chai = require('chai');

// To be tested
var database = require('../src/database');

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



describe('database', function () {
    var file_path = 'example_filepath.jpeg';
    var fragment_name = 'something stupid';

    before(function(done) {
        database.login('bolt://localhost:7687', 'neo4j', '1234').then(function(){done();}, done);
    });

    describe("#Database", function () {
        it('Setup the constraints', function (done) {
            database.init().then(function () {
                done();
            }, function (err) {
                done(err);
            });
        })
    });

    describe("#Database massive test (this may take up to a minute)", function () {

        it('Add 300 images to the db', function (done) {
            var num = 300;
            this.timeout(100000);
            var proms = [];
            for (var i = 0; i < num; i++) {
                proms.push(database.add_image('x' + i));
            }
            Promise.all(proms).then(function (rows) {
                var deletes = [];
                var outer = [];
                var errors = 0;
                for (i = 0; i < num; i++) {
                    outer.push(database.get_image('x' + i).then(function(row){
                        var id = row.get('ident');
                        deletes.push(database.remove_image_by_id(id));
                        return row;
                    }, function(err){
                        errors++;
                        return err;
                    }));
                }

                Promise.all(outer).then(function(outers){
                    Promise.all(deletes).then(function(dels){
                        done();
                    }, function(err){
                        done(err);
                    });
                }, function(err){
                    done(err);
                });
            }, function (err) {
                done(err);
            });
        })
    });

    describe("#Database ", function(){
        /*it('wrong port: Logout and login with wrong creds and then with correct ones', function(done) {
            database.logout();
            database._get_driver().should.equal(false);
            database.login('bolt://localhost:7681', 'neo4', '1234').then(
                function() {
                    database.login('bolt://localhost:7687', 'neo4j', '1234').then(
                        function() {done('there should have been an error');},
                        function() {done('there should have been an error');}
                    );
                }, function() {
                    database.login('bolt://localhost:7687', 'neo4j', '1234').then(
                        function() {done();},
                        function() {done();}
                    );
                }
            );
        });*/

        it('wrong protocol: Logout and login with wrong creds and then with correct ones', function(done) {
            database.logout();
            database._get_driver().should.equal(false);
            database.login('lt://localhost:7681', 'neo4j', '1234').then(
                function() {
                    database.login('bolt://localhost:7687', 'neo4j', '1234').then(
                        function() {done('there should have been an error');},
                        function() {done('there should have been an error');}
                    );
                }, function() {
                    database.login('bolt://localhost:7687', 'neo4j', '1234').then(
                        function() {done();},
                        function() {done();}
                    );
                }
            );
        });
    });

    describe("#Image", function () {
        it("save one", function (done) {
            database.add_image(file_path).then(
                function (result) {
                    done();
                },
                function (err) {
                    done(err);
                })
        });
        /*it("try to save the same again, but should fail because of filepath constraint", function (done) {
            database.add_image(file_path).then(
                function (result) {
                    console.log(result.Error)
                    if (!result.hasOwnProperty('Error')) {
                        done('There should have been an error');
                    } else {
                        done();
                    }
                },
                function (err) {
                    done();
                })
        });*/
        it("get all images and look for ours", function (done) {
            database.get_all_images().then(
                function (records) {
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
                function () {
                    done("Error retrieving Images");
                })
        });
        it("add a fragment to the image", function (done) {
            database.get_image(file_path).then(function (record) {
                database.add_fragment(record.get('ident'), fragment_name).then(function () {
                    done();
                }, function (err) {
                    done(err);
                });
            }, function (err) {
                done(err);
            })
        });


        it("get the fragment", function (done) {
            database.get_fragment(file_path, fragment_name).then(function (record) {
                if (!record.get('fragment_name') === fragment_name) {
                    done('fragment_name mismatch');
                }
                done();
            }, function (err) {
                done(err);
            });
        });
        it("add a node to the fragment", function (done) {
            database.add_node(file_path, fragment_name, 'Token', {id: "1"}).then(function (result) {
                done();
            }, function (err) {
                done(err);
            });
        });
        it("add a second node to the fragment", function (done) {
            database.add_node(file_path, fragment_name, 'Token', {id: "2"}).then(function (result) {
                done();
            }, function (err) {
                done(err);
            });
        });

        it("add en edge between the nodes", function (done) {
            database.add_edge(file_path, fragment_name, "1", "2", {id: "3"}).then(function (number_of_created_nodes) {
                done();
            }, function (err) {
                done(err);
            });
        });

        it('Test the mxgraph_to_neo4j on 9.xml from the codec', function (done) {
            var frag_name_2 = '123456789';
            database.get_image(file_path).then(function (record) {
                database.add_fragment(record.get('ident'), frag_name_2).then(function () {
                    database.get_fragment(file_path, frag_name_2).then(function (record) {
                        var image_id = record.get('image_id');
                        var fragment_id = record.get('ident');
                        var called = false;
                        Codec.mxgraph_to_neo4j(image_id, fragment_id, "../test/xml/9.xml").then(
                            function (graphml) {
                                if (!called) {
                                    called = true;
                                    return done();
                                }
                            },
                            function(err) {
                                done(err);
                            }
                        );
                    }, function (err) {
                        return done(err);
                    });
                }, function (err) {
                    return done(err);
                });
            }, function (err) {
                return done(err);
            })
        });

        it('Test the mxgraph_to_neo4j on 11.xml with groups', function (done) {
            var frag_name_2 = '123456789';
            database.get_image(file_path).then(function (record) {
                database.add_fragment(record.get('ident'), frag_name_2).then(function () {
                    database.get_fragment(file_path, frag_name_2).then(function (record) {
                        var image_id = record.get('image_id');
                        var fragment_id = record.get('ident');
                        var called = false;
                        Codec.mxgraph_to_neo4j(image_id, fragment_id, "../test/xml/11.xml").then(
                            function (graphml) {
                                if (!called) {
                                    called = true;
                                    return done();
                                }
                            }, done
                        );
                    }, function (err) {
                        return done(err);
                    });
                }, function (err) {
                    return done(err);
                });
            }, function (err) {
                return done(err);
            })
        });

        it("now remove the fragment", function (done) {
            database.get_image(file_path).then(function (record) {
                database.remove_fragment(record.get('ident'), fragment_name, false).then(function (record) {
                    done();
                }, function (err) {
                    done(err);
                });
            }, function (err) {
                done(err);
            })

        });
        it("now remove the image again", function (done) {
            database.get_image(file_path).then(function (record) {
                database.remove_image_by_id(record.get('ident')).then(
                    function (number_of_deleted_nodes) {
                        done();
                    },
                    function () {
                        done("Error deleting Images");
                    })
            }, function (err) {
                done(err);
            })
        });

    });

    describe('#Constraints', function () {
        it('double init', function (done) {
            database.init().then(function () {
                database.init().then(function () {
                    done();
                }, done);
            }, done);
        });

        it('double remove', function (done) {
            database._remove_constraints().then(function () {
                database._remove_constraints().then(function () {
                    done('There should have been an error');
                }, function (err) {
                    database.init().then(function () {
                        done();
                    }, done);
                });
            }, function () {
                database._remove_constraints().then(function () {
                    done('There should have been an error');
                }, function (err) {
                    database.init().then(function () {
                        done();
                    }, done);
                });
            });
        });

        it("don't delete fragment", function (done) {
            database.add_image(file_path).then(
                function (result) {
                    var image_id = Number(result.get('ident'));
                    var fn3 = 'fragment3';
                    database.add_fragment(image_id, fn3).then(
                        function (record) {
                            var fragment_id = Number(record.get('ident'));
                            database.remove_fragment(image_id, fragment_id).then(function () {
                                database.get_fragment_by_id(image_id, fragment_id).then(function (record) {
                                    var new_id = Number(record.get('ident'));
                                    if (new_id === fragment_id) {
                                        database.remove_image_by_id(image_id).then(function (data) {
                                            done();
                                        }, done);
                                    } else {
                                        done('fragment id mismatch');
                                    }
                                }, done);
                            }, done);
                        },
                        done
                    );

                },
                function (err) {
                    done(err);
                });
        });

        it("#get_fragments_by_image_id", function (done) {
            database.add_image('snd image').then(
                function (result) {
                    var image_id = result.get('ident');
                    var fn3 = 'fragment3';
                    database.add_fragment(image_id, fn3).then(
                        function (record) {
                            database.get_fragments_by_image_id(image_id).then(function (rows) {
                                if (rows.length === 1) {
                                    done();
                                    database.remove_image_by_id(image_id);
                                } else {
                                    done('rows.length mismatch');
                                }
                            }, done);
                        },
                        done
                    );

                },
                function (err) {
                    done(err);
                });
        });


    });

    describe('#Autocomplete', function () {
        it("get_all_property_values_for_token", function (done) {
            database.add_image('image_321').then(
                function (result) {
                    var image_id = Number(result.get('ident'));
                    var fn3 = 'fragment4';
                    database.add_fragment(image_id, fn3).then(
                        function (record) {
                            var fragment_id = Number(record.get('ident'));
                            Codec.mxgraph_to_neo4j(image_id, fragment_id, '../test/xml/10.xml').then(
                                function (data) {
                                    database.get_all_property_values_for_token('color', '').then(function (ary) {
                                        if (ary.includes('nero') && ary.includes('rosso')) {
                                            database.get_all_property_values_for_token('them_mak', '').then(function (ary) {
                                                if (ary.includes('ultra')) {
                                                    database.remove_image_by_id(image_id).then(function () {
                                                        done()
                                                    }, done);
                                                } else {
                                                    done('missing attribute values');
                                                }
                                            }, done);
                                        } else {
                                            done('missing attribute values');
                                        }
                                    }, done);
                                }, done
                            );
                        },
                        done
                    );

                },
                function (err) {
                    done(err);
                });
        });

        it("get_all_property_keys_for_token", function (done) {
            database.add_image('image_x').then(
                function (result) {
                    var image_id = Number(result.get('ident'));
                    var fn3 = 'fragment4';
                    database.add_fragment(image_id, fn3).then(
                        function (record) {
                            var fragment_id = Number(record.get('ident'));
                            Codec.mxgraph_to_neo4j(image_id, fragment_id, '../test/xml/10.xml').then(
                                function (err, data) {
                                    database.get_all_property_keys_for_token('').then(function (ary) {
                                        if (ary.includes('color') && ary.includes('them_mak')) {
                                            database.get_all_property_keys_for_token('t').then(function (ary) {
                                                if (ary.includes('tool')) {
                                                    database.remove_image_by_id(image_id).then(function () {
                                                        done()
                                                    }, done);
                                                } else {
                                                    done('missing attribute values');
                                                }
                                            }, done);
                                        } else {
                                            done('missing attribute values');
                                        }
                                    }, done);
                                }, done
                            );
                        },
                        done
                    );

                },
                function (err) {
                    done(err);
                });
        });


    })

});

