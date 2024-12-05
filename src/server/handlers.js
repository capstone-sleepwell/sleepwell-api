const {
  getAllUsers,
  getUserByEmail,
  createUser,
  editUserById,
  updateUserPassword,
  getUserById,
  postArticle,
  getArticleById,
  getUserIdByArticleId,
  getUserIdByCommentId,
  getCommentByArticleId,
  deleteCommentById,
  deleteArticleById,
  postComment,
} = require("../dbconfig/db.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { OAuth2Client } = require("google-auth-library");
const oauth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

require("dotenv").config();

const allowedDomains = ["gmail.com"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getHomeHandler = (request, h) => {
  return h.response({
    status: "success",
    message: "HI",
  });
};

const getUsersHandler = async (request, h) => {
  try {
    // get all user from db
    const users = await getAllUsers();
    if (!users.length) {
      console.log("No users found in the database.");
    }
    return h
      .response({
        status: "success",
        data: users,
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const getUserHandler = async (request, h) => {
  try {
    // Data user dari validasi token JWT
    const user = request.auth.credentials;

    // Kembalikan data profile user
    return h
      .response({
        status: "success",
        data: user,
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const editUserHandler = async (request, h) => {
  try {
    // Data user dari validasi token jwt
    const user = request.auth.credentials;
    // Dapatkan data dari user
    const { username, name, birthdate, gender } = request.payload;
    // update
    const editedUser = await editUserById({
      username: username,
      name: name,
      birthdate: birthdate,
      gender: gender,
      userId: user.id,
    });
    // response
    return h
      .response({
        status: "success",
        message: "Data berhasil diubah",
        data: editedUser,
      })
      .code(201);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const addUserHandler = async (request, h) => {
  try {
    // Dapatkan data user dari payload
    const { username, name, email, password, gender, birthdate } =
      request.payload;
    // pastikan semua data terisi
    if (!username || !name || !email || !password || !gender || !birthdate) {
      return h
        .response({
          status: "fail",
          message: "Data tidak boleh kosong!",
        })
        .code(422);
    }
    // verivikasi email
    if (!emailRegex.test(email)) {
      return h
        .response({
          status: "fail",
          message: "Format email tidak valid!",
        })
        .code(422);
    }
    // Ekstrak domain email
    const emailDomain = email.split("@")[1];
    // Validasi domain email
    if (!allowedDomains.includes(emailDomain)) {
      return h
        .response({
          status: "fail",
          message: `Hanya email dengan domain berikut yang diperbolehkan: ${allowedDomains.join(
            ", "
          )}`,
        })
        .code(422);
    }
    // cek apakah email sudah ada di db
    const checkUserEmail = await getUserByEmail(email);
    if (checkUserEmail) {
      return h
        .response({
          status: "fail",
          message: "Email telah terdaftar! Silahkan Login",
        })
        .code(409);
    }
    // hased password
    const hasedPassword = await bcrypt.hash(password, 10);
    const currentDate = new Date().toISOString().slice(0, 19).replace("T", " "); // Format 'YYYY-MM-DD HH:MM:SS'
    // masukan data ke database
    const newUser = await createUser({
      username: username,
      name: name,
      email: email,
      password: hasedPassword,
      birthdate: birthdate,
      gender: gender,
      google_id: null,
      createdAt: currentDate,
      updatedAt: currentDate,
    });
    // token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    // return
    return h
      .response({
        status: "success",
        message: `User Berhasil Dibuat, Selamat Datang ${name}!`,
        token,
      })
      .code(201);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const loginUserHandler = async (request, h) => {
  try {
    const { email, password } = request.payload;
    // jika email/pw blm di isi
    if (!email || !password) {
      return h
        .response({
          status: "fail",
          message: "Lengkapi kolom email dan password dahulu",
        })
        .code(422);
    }
    // cek email di db apakah sudah ada atau belum
    const user = await getUserByEmail(email);
    // jika user belum ada maka
    if (!user) {
      return h
        .response({
          status: "fail",
          message: "Email atau password tidak valid / tidak dikenal",
        })
        .code(401);
    }
    // cek password
    const passwordMatch = await bcrypt.compare(password, user.password);
    // jika email/password salah
    if (!passwordMatch) {
      return h
        .response({
          status: "fail",
          message: "Password tidak valid!",
        })
        .code(401);
    }
    // jika login sukses, generate token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    // return
    return h
      .response({
        status: "success",
        message: `Login Berhasil, Selamat Datang kembali ${user.name}`,
        token,
      })
      .code(200);
  } catch (err) {
    return h
      .response({
        status: "fail",
        message: err.message,
      })
      .code(500);
  }
};

const verifyIdToken = async (idToken) => {
  const ticket = await oauth2Client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

const loginGoogleHandler = async (request, h) => {
  try {
    const currentDate = new Date().toISOString().slice(0, 19).replace("T", " "); // Format 'YYYY-MM-DD HH:MM:SS'
    // ambil informasi profile dari google
    const profile = request.auth.credentials.profile;
    // cek user apakah sudah ada di database berdasarkan email
    const exsistingUser = await getUserByEmail(profile.email);
    // jika user ada maka
    if (exsistingUser) {
      // jika user sudah ada, buat token jwt
      const token = jwt.sign(
        {
          userId: exsistingUser.id,
          email: exsistingUser.email,
          name: exsistingUser.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );
      // response
      return h.response({
        status: "success",
        token,
        message: `Selamat Datang kembali ${exsistingUser.name}!`,
        id: exsistingUser.id,
      });
    }
    // jika user belum terdaftar, simpan data ke dalam database
    const newUser = await createUser({
      username: profile.displayName,
      name: profile.displayName,
      email: profile.email,
      password: null,
      birthdate: null,
      gender: profile.gender,
      google_id: profile.id,
      createdAt: currentDate,
      updatedAt: currentDate,
    });
    // buat token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    // response
    return h.response({
      status: "success",
      token,
      message: `Login Berhasil! Halo ${newUser.name}!`,
      id: newUser.id,
    });
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const addPasswordGoogleHandler = async (request, h) => {
  try {
    const { newPassword } = request.payload;
    // validasi apakah password kosong
    if (!newPassword) {
      return h
        .response({
          status: "fail",
          message: "Password tidak boleh kosong",
        })
        .code(422);
    }
    // validasi panjang karakter (minimal panjang 8)
    if (newPassword.length < 8) {
      return h
        .response({
          status: "fail",
          message: "Panjang karakter minimal 8",
        })
        .code(422);
    }
    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Ambil data pengguna dari JWT token
    const user = request.auth.credentials;
    console.log("Data dari JWT:", user);
    // Perbarui password di database
    const updateResult = await updateUserPassword(user.id, hashedPassword);

    // Jika tidak ada perubahan, beri respons gagal
    if (!updateResult) {
      return h
        .response({
          status: "fail",
          message: "Gagal memperbarui password! Pastikan id valid",
        })
        .code(500);
    }

    return h
      .response({
        status: "success",
        message: "Password berhasil diperbarui!",
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const addArticle = async (request, h) => {
  try {
    const { title, image, body } = request.payload;
    const user = request.auth.credentials;

    if (title.length > 50) {
      return h
        .response({
          status: "fail",
          message: "Title terlalu panjang !",
        })
        .code(400);
    }

    const result = await postArticle(user.id, title, image, body);

    return h
      .response({
        status: "success",
        message: result[0],
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const getArticle = async (request, h) => {
  try {
    const article = await getArticleById(request.params.id);
    const comment = await getCommentByArticleId(request.params.id);
    const tempArr = [...article[0], ...comment[0]];

    return h
      .response({
        status: "success",
        message: tempArr,
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const addComment = async (request, h) => {
  try {
    const { body } = request.payload;
    const user = request.auth.credentials;
    const comment = await postComment(user.id, request.params.id, body);

    if (body.length > 255) {
      return h
        .response({
          status: "fail",
          message: "Title terlalu panjang !",
        })
        .code(400);
    }

    return h
      .response({
        status: "success",
        message: comment[0],
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const deleteComment = async (request, h) => {
  try {
    const user = request.auth.credentials;
    const comment = await getUserIdByCommentId(request.params.commentId);

    if (user.id !== comment.userId) {
      return h
        .response({
          status: "fail",
          message: "User tidak berhak menghapus komen ini !",
        })
        .code(400);
    }

    await deleteCommentById(request.params.commentId);

    return h
      .response({
        status: "success",
        message: "Berhasil menghapus comment",
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

const deleteArticle = async (request, h) => {
  try {
    const user = request.auth.credentials;
    const article = await getUserIdByArticleId(request.params.id);

    if (user.id !== article.userId) {
      return h
        .response({
          status: "fail",
          message: "User tidak berhak menghapus artikel ini !",
        })
        .code(400);
    }

    await deleteArticleById(request.params.id);

    return h
      .response({
        status: "success",
        message: "Berhasil menghapus artikel",
      })
      .code(200);
  } catch (error) {
    return h
      .response({
        status: "fail",
        message: error.message,
      })
      .code(500);
  }
};

module.exports = {
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
};
