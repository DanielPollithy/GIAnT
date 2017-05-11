var express = require('express');
var bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
var fs = require('fs');
var database = require('./database');
var path = require('path');
var codec = require('./codec');



var app = module.exports = express();

app.use(express.static(path.join(__dirname, '..')));

app.use(bodyParser());
app.use(fileUpload());


app.set('views', 'src/views');
app.set('view engine', 'pug');

app.post('/save_xml', function (req, res) {
    if (req.body.filename && req.body.xml) {
        var filename = req.body.filename;
        var xml = req.body.xml;

        if (filename.length === 0) {
            filename = 'draft.xml';
        }

        xml = decodeURIComponent(xml);
        filename = decodeURIComponent(filename);
        console.log(filename);

        /*res.contentType('text/plain');
        res.header('Content-Disposition',
            "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + filename);
        res.status(200);
        res.send(xml);*/
        // TODO: check for .. and such stuff
        fs.writeFile('media/uploaded_xmls/'+filename, xml, function(err){
            if (err) {
                return res.status(500).send("Error saving the file");
            }
            return res.status(200).send("File saved");
        });
    } else {
        res.send("Missing parameter");
    }
});

app.post('/', function (req, res) {
    if (!req.files)
        return res.status(400).send('No files were uploaded.');

    // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
    var sampleFile = req.files.image;

    // Use the mv() method to place the file somewhere on your server
    // TODO: close exploit
    var new_file_name = 'media/uploaded_images/' + sampleFile.name;
    sampleFile.mv(new_file_name, function (err) {
        if (err)
            return res.status(500).send(err);

        database.add_image(sampleFile.name).then(function () {
            res.redirect('/');
        }, function(err){
            return res.status(500).send(err);
        });
    });
});

app.get('/autocomplete/token/values', function(req, res){
    var search_string = req.query.term || '';
    var key = req.query.field;
    console.log(key);
    if (!key)
        return res.status(400).jsonp([]);
    var values = database.get_all_property_values_for_token(key, search_string).then(function(values){
        res.jsonp(values);
    });
});


app.get('/autocomplete/token/keys', function(req, res){
    var search_string = req.query.term || '';
    var keys = database.get_all_property_keys_for_token(search_string).then(function(keys){
        res.jsonp(keys);
    });
});


app.get('/', function (req, res) {
    database.get_all_images().then(function (results) {
            var row_data = [];
            results.forEach(function (r) {
                row_data.push([r.get('ident'), r.get('file_path'), r.get('upload_date')]);
            });
            res.render('image_table',
                {
                    message: '',
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
        }, res.send);
    } else {
        res.send("Missing parameter");
    }
});

app.get('/image/:image_id(\\d+)/fragment/:fragment_id(\\d+)/delete', function (req, res) {
    if (req.params.image_id && req.params.fragment_id) {
        database.remove_fragment(req.params.image_id, req.params.fragment_id)
            .then(function (result) {
                res.redirect('/image/'+ req.params.image_id +'/fragments');
            }, res.status(400).send
            );
    } else {
        res.send("Missing parameter");
    }
});

app.get('/image/:image_id(\\d+)/fragment/:fragment_id(\\d+)/to-db', function (req, res) {
    if (req.params.image_id && req.params.fragment_id) {
        database.remove_fragment(req.params.image_id, req.params.fragment_id, true).then(function(success){
            codec.mxgraph_to_neo4j(req.params.image_id, req.params.fragment_id, function(err, data){
                if (err) {
                    return res.status(400).send(err);
                }
                res.redirect('/image/'+ req.params.image_id +'/fragments');
            });
        }, function(err){
            res.status(500).send(err);
        });
    } else {
        res.send("Missing parameter");
    }
});

app.post('/image/:id(\\d+)/create-fragment', function (req, res) {
    if (req.body.name && req.params.id) {
        var name = req.body.name;
        database.add_fragment(req.params.id, name).then(
            function(result){
                res.redirect('/image/'+ req.params.id +'/fragments');
            }, function(err){
                res.send(err);
            });
    } else {
        res.status(400).send("Missing POST parameter name or image_id");
    }
});

app.get('/image/:id(\\d+)/fragments', function (req, res) {
    if (!req.params.id) {
        return res.send("Missing parameter");
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



if (!module.parent) {
    app.listen(4000);
    console.log('TransliterationApplication Server started an express server on port 4000');
}