const express = require("express");
const routes = require("../api/routes");

function createServer(dependencies) {
  const app = express();

  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    return next();
  });
  app.use(express.json());
  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });
  app.use("/api", routes(dependencies));
  app.use((error, req, res, next) => {
    res.status(400).json({
      error: error.message || "Unexpected error",
    });
  });

  return app;
}

module.exports = { createServer };
