const express = require("express");
const routes = require("../api/routes");

function createServer(dependencies) {
  const app = express();

  app.use(express.json());
  app.use("/api", routes(dependencies));

  return app;
}

module.exports = { createServer };
