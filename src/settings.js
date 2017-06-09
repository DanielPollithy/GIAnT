var fs = require('fs');
var path = require('path');
var log = require('electron-log');


var Settings = Settings || {};

Settings._store = {};

Settings._loaded = false;

Settings._file_path = path.join(__dirname, '../media/settings/settings.json');

Settings.load = function() {
    var json;
    try {
        json = JSON.parse(fs.readFileSync(Settings._file_path, 'utf8'));
    } catch (e) {
        log.error('Could not load settings');
        log.error(e);
        json = {};
    }
    Settings._store = json;
    Settings._loaded = true;
};

Settings.save = function() {
    // in order to avoid a flush we assure the settings were loaded first
    Settings.check_loaded();
    fs.writeFileSync(Settings._file_path, JSON.stringify(Settings._store, null, 4));
};

Settings.check_loaded = function() {
    if (!Settings._loaded) {
        Settings.load();
    }
};

Settings.set = function(key, value) {
    Settings.check_loaded();
    Settings._store[key] = value;
};

Settings.get = function(key, fallback) {
    Settings.check_loaded();
    if (!Settings.has(key)) {
        return fallback;
    }
    return Settings._store[key];
};

Settings.has = function(key) {
    Settings.check_loaded();
    return Settings._store.hasOwnProperty(key);
};

Settings.get_settings_for_frontend = function() {
    Settings.check_loaded();
    return Settings._store;
};

Settings.set_settings_from_frontend = function(new_settings) {
    try {
        var fontSize = new_settings.fontSize;
        if (8 < fontSize && fontSize < 200) {
            Settings._store.styles.defaultVertex.fontSize = fontSize;
        }
        var strokeWidth = new_settings.strokeWidth;
        if (0 < strokeWidth && strokeWidth < 200) {
            Settings._store.defaultEdgeStyle.strokeWidth = strokeWidth;
        }
        var curved = new_settings.curved;
        console.log(curved)
        if (curved === "1") {
            Settings._store.defaultEdgeStyle.curved = "1";
        } else {
            Settings._store.defaultEdgeStyle.curved = "0";
        }
        Settings.save();
    } catch (e) {
        log.error('settings could not be applied');
    }
};

module.exports = Settings;