var plexAPI = require("plex-api");

var managedUser = {
    name: "maxwellvizion",
    pin: 4736
  }
var opts = {
  hostname: "home.lkimmel.com",
  username: "maxwellvizion",
  password: "un2knOwn2you2",
  managedUser: managedUser
}

var client = new plexAPI(opts)

client.query("/library/recentlyAdded").then(function (result) {
  var mc = result.MediaContainer
  console.log("%s running PLex Media Server v%s\n", mc.friendlyName, mc.version);
  console.log(result.MediaContainer);
}, function (err) {
  console.error("Could not connect to server", err);
});
