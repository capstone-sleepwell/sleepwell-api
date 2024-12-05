require("dotenv").config();
const Hapi = require("@hapi/hapi");
const routes = require("../server/routes.js");
const Bell = require("@hapi/bell");
const Cookie = require("@hapi/cookie");
const validate = require("../validate/validate.js");
const HapiAuthJwt2 = require("hapi-auth-jwt2");

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 8080,
    host: "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });
  // Plugin
  await server.register([
    {
      plugin: HapiAuthJwt2,
    },
    {
      plugin: Bell,
    },
    {
      plugin: Cookie,
    },
  ]);
  // Strategy
  server.auth.strategy("jwt", "jwt", {
    key: process.env.JWT_SECRET,
    validate,
  });
  server.auth.strategy("google", "bell", {
    provider: "google",
    password: "cookie_encryption_password_secure",
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    isSecure: false,
    location: server.info.uri,
  });
  // rute
  server.route(routes);

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
