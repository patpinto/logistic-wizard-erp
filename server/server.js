// Licensed under the Apache License. See footer for details.
// initialize our logging framework
var winston = require("winston");
winston.level = process.env.LOG_LEVEL || "info";

var loopback = require("loopback");
var boot = require("loopback-boot");

var servicediscovery = require("./serviceDiscovery")

var serviceEndpoint = 'https://logistics-wizard-erp.mybluemix.net/';

var app = module.exports = loopback();

// This model has no database attached, no id.
// It is used in REST response where we want to combine multiple objects.
loopback.modelBuilder.define("TransientModel", {}, {
  idInjection: false
});

// workaround for "warning: possible EventEmitter memory leak detected"
// seems to be linked to the number of unit tests in the file
// https://github.com/strongloop/loopback-datasource-juggler/pull/939
require("events").EventEmitter.prototype._maxListeners = 100;

app.start = function () {
  // start the web server
  return app.listen(function () {
    app.emit("started");
    var baseUrl = app.get("url").replace(/\/$/, "");
    winston.info("Web server listening at: %s", baseUrl);
    if (app.get("loopback-component-explorer")) {
      var explorerPath = app.get("loopback-component-explorer").mountPath;
      winston.info("Browse your REST API at %s%s", baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function (err) {
  if (err) {
    throw err;
  }

  // notify that the app has booted, ready to be started
  app.booted = true;
  app.emit("booted");

  // start the server if `$ node server.js`
  if (require.main === module) {
    app.start();
  }
});




//Register this applications url to the Service Discovery service
if(process.env.VCAP_SERVICES && process.env.VCAP_APPLICATION){
  servicediscovery.registerInstance("lw-erp", JSON.parse(process.env.VCAP_APPLICATION)['application_uris'][0]);
} else {
  winston.info("Running locally, skipping registration to Service Discovery")
}





//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------
