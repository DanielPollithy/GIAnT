var express = require('express');
const fileUpload = require('express-fileupload');
var fs = require('fs');
var database = require('./database');


var app = module.exports = express();

app.use(fileUpload());


app.set('views', 'src/views');
app.set('view engine', 'pug');

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