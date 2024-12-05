require("dotenv").config();
const {
  getHomeHandler,
  getUsersHandler,
  getUserHandler,
  editUserHandler,
  addUserHandler,
  loginUserHandler,
  loginGoogleHandler,
  addPasswordGoogleHandler,
  addArticle,
  getArticle,
  addComment,
  deleteComment,
  deleteArticle,
} = require("./handlers.js");

const routes = [
  {
    method: "GET",
    path: "/",
    handler: getHomeHandler,
  },
  // get all user
  {
    method: "GET",
    path: "/allUsers",
    handler: getUsersHandler,
  },
  // get user by id (DONE)
  {
    method: "GET",
    path: "/users/profile",
    options: {
      auth: "jwt",
    },
    handler: getUserHandler,
  },
  // endpoint edit profile (name/birthday/gender) (DONE)
  {
    method: "PUT",
    path: "/users/profile/edit",
    options: {
      auth: "jwt",
    },
    handler: editUserHandler,
  },
  // endpoint register tanpa google (DONE)
  {
    method: "POST",
    path: "/register",
    handler: addUserHandler,
  },
  // enpoint login tanpa google (DONE)
  {
    method: "POST",
    path: "/login",
    handler: loginUserHandler,
  },
  // endpoint login dengan google (DONE)
  {
    method: "GET",
    path: "/login/google",
    handler: loginGoogleHandler,
    options: {
      auth: "google",
    },
  },
  // endpoint set password untuk google user
  {
    method: "POST",
    path: "/users/profile/setPassword",
    options: {
      auth: "jwt",
    },
    handler: addPasswordGoogleHandler,
  },
  // endpoint post article
  {
    method: "POST",
    path: "/articles",
    options: {
      auth: "jwt",
    },
    handler: addArticle,
  },
  // endpoint get article and comment
  {
    method: "GET",
    path: "/articles/{id}",
    options: {
      auth: "jwt",
    },
    handler: getArticle,
  },
  // endpoint post comment
  {
    method: "POST",
    path: "/articles/{id}",
    options: {
      auth: "jwt",
    },
    handler: addComment,
  },
  // endpoint post comment
  {
    method: "DELETE",
    path: "/articles/{id}",
    options: {
      auth: "jwt",
    },
    handler: deleteArticle,
  },
  // endpoint delete comment
  {
    method: "DELETE",
    path: "/articles/{id}/{commentId}",
    options: {
      auth: "jwt",
    },
    handler: deleteComment,
  },
];

module.exports = routes;
