const { createProxyMiddleware } = require("http-proxy-middleware");

console.log("Setting up a Proxy to localhost:5000");
module.exports = function(app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:5000",
      changeOrigin: true
    })
  );
};
