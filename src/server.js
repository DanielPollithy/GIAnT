var express = require('express');
var bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
var fs = require('fs');
var database = require('./database');
var path = require('path');



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
                row_data.push([r.get('ident'), r.get('file_path'), r.get('upload_date'), r.get('completed')]);
            });
            res.render('table',
                {
                    title: 'Hey',
                    message: 'Hello there!',
                    rows: row_data
                });
        }
    );
});

app.get('/delete', function (req, res) {
    if (req.query.ident) {
        var id_ = req.query.ident;
        database.remove_image_by_id(id_).then(function (r) {
            res.redirect('/');
        });
    } else {
        res.send("Missing parameter");
    }
});



if (!module.parent) {
    app.listen(4000);
    console.log('Express started on port 4000');
}