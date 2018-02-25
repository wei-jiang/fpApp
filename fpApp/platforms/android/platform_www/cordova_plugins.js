cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
  {
    "id": "cordova-plugin-android-fingerprint-auth.FingerprintAuth",
    "file": "plugins/cordova-plugin-android-fingerprint-auth/www/FingerprintAuth.js",
    "pluginId": "cordova-plugin-android-fingerprint-auth",
    "clobbers": [
      "FingerprintAuth"
    ]
  },
  {
    "id": "go.free.cordova.exitapp.exitApp",
    "file": "plugins/go.free.cordova.exitapp/www/ExitApp.js",
    "pluginId": "go.free.cordova.exitapp",
    "merges": [
      "navigator.app"
    ]
  }
];
module.exports.metadata = 
// TOP OF METADATA
{
  "cordova-plugin-whitelist": "1.3.3",
  "cordova-plugin-android-fingerprint-auth": "1.4.3",
  "cordova-plugin-crosswalk-webview": "2.4.0",
  "go.free.cordova.exitapp": "1.0.0"
};
// BOTTOM OF METADATA
});