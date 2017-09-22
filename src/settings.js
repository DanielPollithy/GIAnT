var fs = require('fs');
var path = require('path');
var log = require('electron-log');

/**
 *
 * Settings
 * --------
 * Gives easy access to a key value storage persisted in a single file. <br>
 *
 * <b>Takes care of the validation of editor settings and constraint settings.</b>
 *
 * @class Settings
*/
var Settings = Settings || {};

/**
 * In memory store
 *
 * @property _store
 * @type {object}
 * @default {}
 */
Settings._store = {};

/**
 * Whether the in-memory-store was already populated
 *
 * @property _loaded
 * @type {boolean}
 * @default false
 */
Settings._loaded = false;

/**
 * The path of the settings file
 *
 * @property _file_path
 * @type {string}
 * @default path.join(__dirname, '../media/settings/settings.json')
 */
Settings._file_path = path.join(__dirname, '../media/settings/settings.json');

/**
* Loads the file
 *
* @method load
*/
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

/**
* Saves the file
 *
* @method save
*/
Settings.save = function() {
    // in order to avoid a flush we assure the settings were loaded first
    Settings.check_loaded();
    fs.writeFileSync(Settings._file_path, JSON.stringify(Settings._store, null, 4));
};

/**
* If the storage is not loaded -> load it.
 *
* @method check_loaded
*/
Settings.check_loaded = function() {
    if (!Settings._loaded) {
        Settings.load();
    }
};

/**
* Set the key to the value
 *
* @method set
* @param key {string}
* @param value {*}
*/
Settings.set = function(key, value) {
    Settings.check_loaded();
    Settings._store[key] = value;
};

/**
* Get the value of the key
 *
* @method get
* @param key {string}
* @param fallback {*}
* @return {*}
*/
Settings.get = function(key, fallback) {
    Settings.check_loaded();
    if (!Settings.has(key)) {
        return fallback;
    }
    return Settings._store[key];
};

/**
* Check whether the key carries data in the storage
 *
* @method has
* @param key {string}
* @return {boolean}
*/
Settings.has = function(key) {
    Settings.check_loaded();
    return Settings._store.hasOwnProperty(key);
};

/**
* Returns the whole storage
 *
* @method get_settings_for_frontend
* @return {*}
*/
Settings.get_settings_for_frontend = function() {
    Settings.check_loaded();
    return Settings._store;
};

/**
* Check the values of the new settings and store them if they are okay
 *
* @method set_settings_from_frontend
* @param new_settings {*}
*/
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

/**
* Get the constraint settings Settings._store.constraints
 *
* @method get_settings_for_constraints
* @return {*}
*/
Settings.get_settings_for_constraints = function() {
    Settings.check_loaded();
    return Settings._store.constraints;
};

module.exports = Settings;