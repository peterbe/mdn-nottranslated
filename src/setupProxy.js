const { createProxyMiddleware } = require("http-proxy-middleware");

console.log({ NODE_ENV: process.env.NODE_ENV }); // debugging!

if (process.env.NODE_ENV === "development") {
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
} else {
  console.log("Not in development, so no proxy server");
}
