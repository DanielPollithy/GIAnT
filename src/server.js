var express = require('express');
var bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
var fs = require('fs');
var database = require('./database');
var path = require('path');
var codec = require('./codec');
var utils = require('./utils');
var Settings = require('./settings');
var sizeOf = require('image-size');

var log = require('electron-log');

var app = module.exports = express();

console.log('dirname', __dirname);
app.use(express.static(path.join(__dirname, '..')));

app.use(bodyParser());
app.use(fileUpload());

// database logged in middleware
app.use(function (req, res, next) {
    if (!database.logged_in) {
        req.url = '/db';
    }
    next();
});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.get('/db', function (req, res) {
    if (database.logged_in) {
        res.render('db_logout', {message: ''});
    } else {
        res.render('db_settings', {message: ''});
    }

});

app.post('/db-drop', function (req, res) {
    database.logout();
    res.redirect('/db');
});

app.post('/db', function (req, res) {
    if (req.body.url && req.body.user && req.body.password) {
        var url = req.body.url;
        var user = req.body.user;
        var password = req.body.password;
        log.info('connecting to ' + url + ' as ' + user);
        database.login(url, user, password).then(
            function(){
                var s = Math.round(new Date().getTime());
                console.log(s);
                res.redirect('/?i=' + s);
            }).catch(
            function(error){
                log.warn('connection failed ' + url + ' as ' + user);
                log.warn(error);
                return res.render('db_settings', {message: 'Login failed with ' + error});
            }
        );
    } else {
        log.info('missing params for POST to /db');
        return res.render('db_settings', {message: 'Missing data'});
    }
});

app.post('/save_xml', function (req, res) {
    if (req.body.filename && req.body.xml) {
        var filename = req.body.filename;
        log.info('/save_xml ' + filename);
        var xml = req.body.xml;

        if (filename.length === 0) {
            log.warn('Filename in /save_xml is empty -> fallback: draft.xml');
            filename = 'draft.xml';
        }

        xml = decodeURIComponent(xml);
        filename = decodeURIComponent(filename);

        // check for path escapes (http://localhost/../../../../../etc/passwd)
        // -> only save to files in the uploaded_xmls folder
        var target_file = path.join(__dirname, '..', 'media', 'uploaded_xmls', filename);
        if (target_file.indexOf(path.join(__dirname, '..', 'media', 'uploaded_xmls')) == 0) {
            log.info('XML has valid path: ' + target_file);
        } else {
            log.error('XML path tried to escape: ' + target_file);
            return res.status(400).send('Error');
        }
        // write file to uploaded_xmls
        fs.writeFile(target_file, xml, function (err) {
            if (err) {
                log.error('There was an error saving the xml: ' + target_file);
                return res.status(500).send("Error saving the file");
            }
            log.info('XML saved: ' + target_file);
            return res.status(200).send("File saved");
        });
    } else {
        log.info('missing param');
        return res.status(400).send("Missing parameter");
    }
});

app.post('/', function (req, res) {
    if (!req.files || !req.files.image) {
        log.warn('Image upload without image');
        return res.redirect('/?e=' + encodeURIComponent('Missing file'))
    }

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    var image_file = req.files.image;

    // Use the mv() method to place the file somewhere on your server
    var new_file_name = path.join(__dirname, '..', 'media', 'uploaded_images', image_file.name);

    if (new_file_name.indexOf(path.join(__dirname, '..', 'media', 'uploaded_images')) == 0) {
        log.info('Image has valid path: ' + new_file_name);
    } else {
        log.error('Image path tried to escape: ' + new_file_name);
        return res.redirect('/?e=' + encodeURIComponent('Image path error'))
    }

    // write file to uploaded_images
    image_file.mv(new_file_name, function (err) {
        if (err) {
            log.error('There was an error saving the image: ' + new_file_name);
            return res.redirect('/?e=' + encodeURIComponent('Missing image error saving the image'))
        }
        utils.get_exif_from_image(new_file_name, function (exif_err, exif_data) {
            if (exif_err) {
                log.warn('There was an error reading exif from image: ' + new_file_name);
                exif_data = null;
            }
            if (!exif_data) {
                sizeOf(new_file_name, function (err, dimensions) {
                    if (err) throw err;

                    var alternative_meta = {
                        'exif': {
                            'ExifImageWidth': dimensions.width,
                            'ExifImageHeight': dimensions.height
                        }
                    };
                    console.log(alternative_meta);
                    database.add_image(image_file.name, alternative_meta).then(function () {
                        log.info('Added image: ' + new_file_name);
                        res.status(200).redirect('/');
                    }, function (err) {
                        log.error('Error on adding an image to the database: ' + new_file_name);
                        return res.redirect('/?e=' + encodeURIComponent(err))
                    });
                })
            } else {
                console.log(exif_data);
                database.add_image(image_file.name, exif_data).then(function () {
                    log.info('Added image: ' + new_file_name);
                    res.status(200).redirect('/');
                }, function (err) {
                    log.error('Error on adding an image to the database: ' + new_file_name);
                    return res.redirect('/?e=' + encodeURIComponent(err))
                });
            }
        });
    });
});

app.get('/autocomplete/token/values', function (req, res) {
    var search_string = req.query.term || '';
    var key = req.query.field;
    console.log(key);
    if (!key)
        return res.status(400).jsonp([]);
    var values = database.get_all_property_values_for_token(key, search_string).then(function (values) {
        res.jsonp(values);
    });
});


app.get('/autocomplete/token/keys', function (req, res) {
    var search_string = req.query.term || '';
    var keys = database.get_all_property_keys_for_token(search_string).then(function (keys) {
        res.jsonp(keys);
    });
});


app.get('/', function (req, res) {
    var msg = req.query.e || '';
    var info = req.query.m || '';
    msg = decodeURIComponent(msg);
    info = decodeURIComponent(info);
    if (msg.length > 0) {
        msg = 'Error: ' + msg;
    }
    database.get_all_images().then(function (results) {
            var row_data = [];
            results.forEach(function (r) {
                row_data.push([r.get('ident'), r.get('file_path'), r.get('upload_date')]);
            });
            res.render('image_table',
                {
                    message: msg,
                    info: info,
                    rows: row_data
                });
        }
    );
});

app.get('/image/:id(\\d+)/delete', function (req, res) {
    if (req.params.id) {
        var id_ = req.params.id;
        database.remove_image_by_id(id_).then(function (result) {
            res.redirect('/');
        }, function (err) {
            log.error(err);
            return res.redirect('/?e=' + encodeURIComponent(err))
        });
    } else {
        return res.redirect('/?e=' + encodeURIComponent('Missing parameter'));
    }
});

app.get('/image/:image_id(\\d+)/fragment/:fragment_id(\\d+)/delete', function (req, res) {
    if (req.params.image_id && req.params.fragment_id) {
        database.remove_fragment(req.params.image_id, req.params.fragment_id, false)
            .then(function (result) {
                res.redirect('/image/' + req.params.image_id + '/fragments');
            }, function (err) {
                log.error(err);
                return res.redirect('/?e=' + encodeURIComponent(err))
            });
    } else {
        return res.redirect('/?e=' + encodeURIComponent('Missing parameter'));
    }
});


app.get('/image/:image_id(\\d+)/fragment/:fragment_id(\\d+)/toggle-complete', function (req, res) {
    if (req.params.image_id && req.params.fragment_id) {
        database.toggle_fragment_completed(req.params.image_id, req.params.fragment_id)
            .then(function (result) {
                res.redirect('/image/' + req.params.image_id + '/fragments');
            }, function (err) {
                log.error(err);
                return res.redirect('/?e=' + encodeURIComponent(err))
            });
    } else {
        return res.redirect('/?e=' + encodeURIComponent('Missing parameter'));
    }
});

app.get('/image/:image_id(\\d+)/fragment/:fragment_id(\\d+)/to-db', function (req, res) {
    if (req.params.image_id && req.params.fragment_id) {
        database.remove_fragment(req.params.image_id, req.params.fragment_id, true).then(function (success) {
            codec.mxgraph_to_neo4j(req.params.image_id, req.params.fragment_id, function (err, data) {
                if (err) {
                    log.error(err);
                    return res.redirect('/?e=' + encodeURIComponent(err));
                }
                res.redirect('/image/' + req.params.image_id + '/fragments');
            });
        }, function (err) {
            log.error(err);
            return res.redirect('/?e=' + encodeURIComponent(err));
        });
    } else {
        return res.redirect('/?e=' + encodeURIComponent('Missing parameter'));
    }
});

app.get('/image/:image_id(\\d+)/fragment/:fragment_id(\\d+)/comment', function (req, res) {
    if (req.params.image_id && req.params.fragment_id) {
        var image_id = Number(req.params.image_id);
        var fragment_id = Number(req.params.fragment_id);
        database.get_fragment_by_id(image_id, fragment_id).then(
            function(row) {
                var fragment_name = row.get('fragment_name');
                var comment = row.get('comment');
                res.render('comment',
                {
                    message: '',
                    comment: comment,
                    fragment_name: fragment_name,
                    image_id: image_id,
                    fragment_id: fragment_id
                });
            },
            function(err) {
                return res.redirect('/?e=' + encodeURIComponent('Error fetching fragment'));
            }
        );

    } else {
        return res.redirect('/?e=' + encodeURIComponent('Missing parameter'));
    }
});

app.post('/image/:image_id(\\d+)/fragment/:fragment_id(\\d+)/comment', function (req, res) {
    if (req.body.comment && req.params.image_id && req.params.fragment_id) {
        var image_id = Number(req.params.image_id);
        var fragment_id = Number(req.params.fragment_id);
        var comment = req.body.comment;
        database.add_comment_to_fragment(fragment_id, comment).then(
            function (result) {
                res.render('comment',
                {
                    message: '',
                    comment: comment,
                    image_id: image_id,
                    fragment_id: fragment_id
                });
            }, function (err) {
                log.error(err);
                res.render('comment',
                {
                    message: err,
                    comment: comment,
                    image_id: image_id,
                    fragment_id: fragment_id
                });
            });
    } else {
        log.warn('Missing params for /comment');
        return res.redirect('/?e=' + encodeURIComponent('Missing POST parameter comment or ids'));
    }
});

app.post('/image/:id(\\d+)/create-fragment', function (req, res) {
    if (req.body.name && req.params.id) {
        var name = req.body.name;
        database.add_fragment(req.params.id, name).then(
            function (result) {
                res.redirect('/image/' + req.params.id + '/fragments');
            }, function (err) {
                log.error(err);
                return res.redirect('/?e=' + encodeURIComponent(err));
            });
    } else {
        log.warn('Missing params for /create-fragment');
        return res.redirect('/?e=' + encodeURIComponent('Missing POST parameter name or image_id'));
    }
});

app.get('/image/:id(\\d+)/fragments', function (req, res) {
    if (!req.params.id) {
        return res.redirect('/?e=' + encodeURIComponent('Missing parameter'));
    }
    database.get_fragments_by_image_id(req.params.id).then(function (results) {
            var row_data = [];
            results.forEach(function (r) {
                row_data.push(
                    [
                        r.get('image_id'),
                        r.get('file_path'),
                        r.get('fragment_id'),
                        r.get('fragment_name'),
                        r.get('comment') || '',
                        r.get('upload_date'),
                        r.get('completed')
                    ]
                );
            });
            res.render('fragment_table',
                {
                    message: '',
                    rows: row_data,
                    image_id: req.params.id
                });
        }
    );
});

// heatmap needs to execute cypher -> only on local installation available -> setting activation!!
app.get('/heatmap', function (req, res) {
    res.render('heatmap_config', {message: ''});
});

app.post('/heatmap-generate', function (req, res) {
    if (req.body.query && req.body.normalization && req.body.width && req.body.height && req.body.pixel_size) {
        var query = req.body.query;
        var normalization = req.body.normalization;
        var width = req.body.width;
        var height = req.body.height;
        var pixel_size = req.body.pixel_size;

        utils.process_heatmap_query(query, Number(normalization), Number(width), Number(height), pixel_size)
            .then(
                function (data) {
                    res.render('heatmap',
                        {
                            message: '',
                            query: query,
                            num_tokens: data.num_tokens,
                            num_errors: data.num_errors,
                            normalization: normalization,
                            width: width,
                            height: height,
                            json: JSON.stringify(data.heat_map),
                            ratio: width/height,
                            pixel_size: pixel_size
                        }
                        );
                },
                function (err) {
                    res.render('heatmap_config', {message: err});
                }
            );
    } else {
        log.warn('Missing params for /heatmap-generate');
        return res.redirect('/?e=' + encodeURIComponent('Missing POST parameter'));
    }
});

app.get('/settings', function (req, res) {
    var sets = Settings.get_settings_for_frontend();
    console.dir(sets);
    var settings = {
        "fontSize": sets.styles.defaultVertex.fontSize,
        "curved": sets.defaultEdgeStyle.curved,
        "strokeWidth": sets.defaultEdgeStyle.strokeWidth
    };
    res.render('settings',
    {
        settings: settings,
        message: ''
    });
});

app.get('/batch-add-to-neo4j', function (req, res) {
    codec.add_all_completed_fragments_to_neo4j().then(
        function() {
            res.redirect('/?m=' + encodeURIComponent('Success'));
        },
        function(err) {
            console.error(err);
            return res.redirect('/?e=' + encodeURIComponent('Error in batch add'));
        }
    );
});

app.post('/settings', function (req, res) {
    if (req.body.fontSize && req.body.curved && req.body.strokeWidth) {
        var curved = req.body.curved || "0";
        var fontSize = req.body.fontSize;
        var strokeWidth = req.body.strokeWidth;

        var settings = {
            'fontSize': fontSize,
            'curved': curved,
            'strokeWidth': strokeWidth
        };
        Settings.set_settings_from_frontend(settings);
        return res.redirect('/settings')
    } else {
        log.warn('Missing params for /settings');
        return res.redirect('/?e=' + encodeURIComponent('Missing POST parameter for settings'));
    }
});

function run() {
    app.listen(4000);
    log.info('TransliterationApplication Server started on http://localhost:4000/');
    console.log('READY');
}

if (!module.parent) {
    run()
}

module.exports = {'run': run};