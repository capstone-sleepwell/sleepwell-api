const mysql = require("mysql2/promise");
const nanoid = require("nanoid");
require("dotenv").config();
let db;
// koneksi
async function initializeDB() {
  try {
    console.log("Initializing database connection...");
    db = await mysql.createPool({
      //host: `/cloudsql/dhimas-main-project-441411:asia-southeast2:sleepwell-testing`,
      host: "34.50.86.58",
      port: 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    console.log("Database connection established!");
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
    throw error;
  }
}

initializeDB().catch((error) => {
  console.error("Failed to initialize database connection:", error);
});

//fungsi create user baru
async function createUser(userData) {
  try {
    // ambil data dari userdata
    const {
      username,
      name,
      email,
      password,
      birthdate,
      gender,
      google_id,
      createdAt,
      updatedAt,
    } = userData;
    const userId = nanoid(21);
    // simpan user ke db
    await db.query(
      `INSERT INTO users (id, username, name, email, password, birthdate, gender, google_id, createdAt, updatedAt)
       VALUES ('${userId}', '${username}', '${name}', '${email}', '${password}', '${createdAt}', '${gender}', '${google_id}', '${createdAt}', '${updatedAt}')`
    );

    // ambil user yang baru dibuat
    const [newUser] = await db.query(
      `SELECT * FROM users WHERE id = '${userId}'`
    );
    // return data user
    return newUser[0];
  } catch (error) {
    throw error;
  }
}

// fungsi untuk mengambil seluruh data user
async function getAllUsers() {
  try {
    const [allUsers] = await db.query("SELECT * FROM users");
    console.log("Fetched users:", allUsers);
    return allUsers;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}
//fungsi untuk mencari user berdasarkan id
async function getUserById(userId) {
  try {
    const [userById] = await db.query(
      `SELECT * FROM users WHERE id = '${userId}'`
    );
    return userById;
  } catch (error) {
    return [];
  }
}
// fungsi untuk mencari user dengan email
async function getUserByEmail(email) {
  try {
    const [userByEmail] = await db.query(
      `SELECT * FROM users WHERE email = '${email}'`
    );
    return userByEmail[0];
  } catch (error) {
    return null;
  }
}
// fungsi untuk mengedit data user berdasarkan id
async function editUserById(userData) {
  try {
    const { userId, name, birthdate, gender } = userData;
    const currentDate = new Date().toISOString().slice(0, 19).replace("T", " "); // Format 'YYYY-MM-DD HH:MM:SS'

    await db.query(
      `UPDATE users SET name = '${name}', birthdate = '${birthdate}', gender = '${gender}', updatedAt = '${currentDate}' WHERE id = '${userId}'`
    );
    const [updatedData] = await db.query(
      `SELECT id, name, birthdate, gender, updatedAt FROM users WHERE id = '${userId}'`
    );
    return updatedData;
  } catch (error) {
    return null;
  }
}
// fungsi update password
async function updateUserPassword(userId, hashedPassword) {
  try {
    const result = await db.query(
      `UPDATE users SET password = '${hashedPassword}' WHERE id = '${userId}'`
    );
    // Periksa apakah query berhasil memperbarui baris
    if (result[0].affectedRows > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return null;
  }
}

async function postArticle(userId, title, image, body) {
  const id = nanoid(21);

  try {
    await db.query(
      `INSERT INTO articles (id, userId, title, image, body) VALUES ('${id}', '${userId}', '${title}', '${image}', '${body}')`
    );
    // Periksa apakah query berhasil memperbarui baris
    const check = await db.query(`SELECT * FROM articles WHERE id = '${id}'`);

    return check;
  } catch (error) {
    return null;
  }
}

async function getArticleById(id) {
  try {
    const result = await db.query(`SELECT * FROM articles WHERE id = '${id}'`);

    return result;
  } catch (error) {
    return null;
  }
}

async function getCommentById(id) {
  try {
    const result = await db.query(`SELECT * FROM comments WHERE id = '${id}'`);

    return result;
  } catch (error) {
    return null;
  }
}

async function getUserIdByCommentId(id) {
  try {
    const result = await db.query(
      `SELECT userId FROM comments WHERE id = '${id}'`
    );

    return result[0][0];
  } catch (error) {
    return null;
  }
}

async function getUserIdByArticleId(id) {
  try {
    const result = await db.query(
      `SELECT userId FROM articles WHERE id = '${id}'`
    );

    return result[0][0];
  } catch (error) {
    return null;
  }
}

async function deleteArticleById(id) {
  try {
    await db.query(`DELETE FROM comments WHERE articleId = '${id}'`);

    const result = await db.query(`DELETE FROM articles WHERE id = '${id}'`);

    return result;
  } catch (error) {
    return null;
  }
}

async function getCommentByArticleId(id) {
  try {
    const result = await db.query(
      `SELECT * FROM comments WHERE articleId = '${id}'`
    );

    return result;
  } catch (error) {
    return null;
  }
}

async function postComment(userId, articleId, body) {
  const id = nanoid(21);
  const currentDate = new Date().toISOString().slice(0, 19).replace("T", " "); // Format 'YYYY-MM-DD HH:MM:SS'

  try {
    await db.query(
      `INSERT INTO comments (id, userId, articleId, body, createdAt, updatedAt) VALUES ('${id}', '${userId}', '${articleId}', '${body}', '${currentDate}', '${currentDate}')`
    );

    const result = await db.query(`SELECT * FROM comments WHERE id = '${id}'`);

    return result;
  } catch (error) {
    return null;
  }
}

async function deleteCommentById(commentId) {
  try {
    const result = await db.query(
      `DELETE FROM comments WHERE id = '${commentId}'`
    );

    return result;
  } catch (error) {
    return null;
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  getUserByEmail,
  editUserById,
  updateUserPassword,
  postArticle,
  getArticleById,
  getCommentByArticleId,
  getCommentById,
  getUserIdByCommentId,
  deleteCommentById,
  getUserIdByArticleId,
  deleteArticleById,
  postComment,
};
