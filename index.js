const express = require("express");
const mysql = require("mysql");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = 5008;

// MySQL bağlantı ayarları
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "ileri_web_final",
});

// Veritabanına bağlanma
db.connect((err) => {
  if (err) {
    console.error("MySQL bağlantı hatası:", err);
    return;
  }
  console.log("MySQL veritabanına bağlanıldı!");
});

// Oturum yönetimi
app.use(
  session({
    secret: "gizliAnahtar",
    resave: false,
    saveUninitialized: true,
  })
);

// POST verilerini almak için
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tüm verileri `calendar` tablosundan çek
app.get("/calendar", (req, res) => {
  const query = "SELECT * FROM calendar";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Sorgu hatası:", err);
      res.status(500).send("Bir hata oluştu.");
      return;
    }
    res.json(results);
  });
});
app.get("/calendar/:id", (req, res) => {
  const query = "SELECT * FROM calendar WHERE id = ?";
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error("Sorgu hatası:", err);
      res.status(500).send("Bir hata oluştu.");
      return;
    }
    res.json(results);
    console.log(results);
  });
});
app.get("/event/:id", (req, res) => {
  const query = "SELECT * FROM event WHERE id = ?";
  db.query(query, [req.params.id], (err, results) => {
    if (err) {
      console.error("Sorgu hatası:", err);
      res.status(500).send("Bir hata oluştu.");
      return;
    }
    res.json(results);
    console.log(results);
  });
});

// Tüm verileri `event` tablosundan çek
app.get("/event", (req, res) => {
  const query = "SELECT * FROM event";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Sorgu hatası:", err);
      res.status(500).send("Bir hata oluştu.");
      return;
    }
    res.json(results);
  });
});

// Belirli bir takvime ait etkinlikleri çek
app.get("/events/:calendarId", (req, res) => {
  const calendarId = req.params.calendarId;
  const query = "SELECT * FROM event WHERE calendarId = ?";
  db.query(query, [calendarId], (err, results) => {
    if (err) {
      console.error("Sorgu hatası:", err);
      res.status(500).send("Bir hata oluştu.");
      return;
    }
    res.json(results);
  });
});

// Etkinlik ekleme
app.post("/add-event", (req, res) => {
  const { title, startDate, finishDate, startTime, finishTime, calendarId } =
    req.body;
  const query =
    "INSERT INTO event (title, startDate, finishDate, startTime, finishTime, calendarId) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    query,
    [title, startDate, finishDate, startTime, finishTime, calendarId],
    (err, results) => {
      if (err) {
        console.error("Etkinlik ekleme hatası:", err);
        res.json({ success: false, message: err.message });
        return;
      }
      res.json({ success: true });
    }
  );
});

// Etkinlik silme
app.post("/delete-event", (req, res) => {
  const { id } = req.body;

  const query = "DELETE FROM event WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error("Etkinlik silme hatası:", err);
      res.json({ success: false });
      return;
    }

    if (results.affectedRows === 0) {
      console.log("Etkinlik bulunamadı veya silinemedi.");
      res.json({
        success: false,
        message: "Etkinlik bulunamadı veya silinemedi.",
      });
    } else {
      console.log("Etkinlik başarıyla silindi.");
      res.json({ success: true });
    }
  });
});

// Takvim ekleme
app.post("/add-calendar", (req, res) => {
  const { name } = req.body;
  const query = "INSERT INTO calendar (name) VALUES (?)";
  db.query(query, [name], (err, results) => {
    if (err) {
      console.error("Takvim ekleme hatası:", err);
      res.json({ success: false });
      return;
    }
    res.json({ success: true });
  });
});

// Takvim ve ilgili etkinlikleri silme
app.post("/delete-calendar", (req, res) => {
  const { id } = req.body;

  // İlk olarak, takvime bağlı tüm etkinlikleri sil
  const deleteEventsQuery = "DELETE FROM event WHERE calendarId = ?";
  db.query(deleteEventsQuery, [id], (err, results) => {
    if (err) {
      console.error("Etkinlikler silinirken hata oluştu:", err);
      res.json({ success: false });
      return;
    }

    // Ardından, takvimi sil
    const deleteCalendarQuery = "DELETE FROM calendar WHERE id = ?";
    db.query(deleteCalendarQuery, [id], (err, results) => {
      if (err) {
        console.error("Takvim silme hatası:", err);
        res.json({ success: false });
        return;
      }
      res.json({ success: true });
    });
  });
});

// Takvim güncelleme
app.put("/update-calendar/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const query = "UPDATE calendar SET name = ? WHERE id = ?";
  db.query(query, [name, id], (err, results) => {
    if (err) {
      console.error("Takvim güncelleme hatası:", err);
      res.json({ success: false });
      return;
    }
    if (results.affectedRows === 0) {
      console.log("Takvim bulunamadı veya güncellenemedi.");
      res.json({
        success: false,
        message: "Takvim bulunamadı veya güncellenemedi.",
      });
    } else {
      console.log("Takvim başarıyla güncellendi.");
      res.json({ success: true });
    }
  });
});

// Etkinlik güncelleme
app.put("/update-event/:id", (req, res) => {
  const { id } = req.params;
  const { title, startDate, finishDate, startTime, finishTime, calendarId } =
    req.body;
  const query =
    "UPDATE event SET title = ?, startDate = ?, finishDate = ?, startTime = ?, finishTime = ?, calendarId = ? WHERE id = ?";
  console.log(
    id,
    title,
    startDate,
    finishDate,
    startTime,
    finishTime,
    calendarId
  );
  db.query(
    query,
    [title, startDate, finishDate, startTime, finishTime, calendarId, id],
    (err, results) => {
      if (err) {
        console.error("Etkinlik güncelleme hatası:", err);
        res.json({ success: false });
        return;
      }
      if (results.affectedRows === 0) {
        console.log("Etkinlik bulunamadı veya güncellenemedi.");
        res.json({
          success: false,
          message: "Etkinlik bulunamadı veya güncellenemedi.",
        });
      } else {
        console.log("Etkinlik başarıyla güncellendi.");
        res.json({ success: true });
      }
    }
  );
});

// Statik dosyaları sunma
app.use(express.static(path.join(__dirname, "public")));

// Ana sayfa yönlendirmesi
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "calendar.html"));
});

// Login sayfası yönlendirmesi
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// Admin dashboard yönlendirmesi
app.get("/admin", (req, res) => {
  if (req.session.user) {
    res.sendFile(path.join(__dirname, "views", "admin.html"));
  } else {
    res.redirect("/login");
  }
});

// Giriş işlemi
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  const query = "SELECT * FROM users WHERE name = ?";
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error("Sorgu hatası:", err);
      res.status(500).send("Bir hata oluştu.");
      return;
    }
    if (results.length > 0) {
      const user = results[0];
      if (password === user.password) {
        req.session.user = user;
        res.redirect("/admin");
      } else {
        res.send("Kullanıcı adı veya şifre yanlış.");
      }
    } else {
      res.send("Kullanıcı adı veya şifre yanlış.");
    }
  });
});

// Kullanıcı adını döndüren endpoint
app.get("/get-username", (req, res) => {
  if (req.session.user) {
    res.json({ name: req.session.user.name });
  } else {
    res.status(401).send("Oturum açılmamış.");
  }
});

// Çıkış işlemi
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Oturum sonlandırılırken hata oluştu:", err);
      res.status(500).send("Çıkış yapılamadı.");
    } else {
      res.redirect("/");
    }
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});
