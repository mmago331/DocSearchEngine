import express from "express";
import bcrypt from "bcryptjs";
import { q } from "../db.js";

const router = express.Router();

router.get("/login", (req, res) => {
  if ((req.session as any).userId) {
    return res.redirect("/");
  }
  res.render("login", { error: req.query.error === "1" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const rows = await q<{ id: string; password_hash: string }>(
    "select id, password_hash from users where email=$1",
    [email]
  );
  let user = rows[0];
  const adminEmail = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  if (adminEmail && adminPass && email === adminEmail && password === adminPass) {
    if (!user) {
      const adminHash = bcrypt.hashSync(adminPass, 10);
      const created = await q<{ id: string }>(
        "insert into users(email,password_hash) values($1,$2) returning id",
        [adminEmail, adminHash]
      );
      user = { id: created[0].id, password_hash: adminHash };
    } else if (!bcrypt.compareSync(adminPass, user.password_hash)) {
      const adminHash = bcrypt.hashSync(adminPass, 10);
      await q("update users set password_hash=$1 where id=$2", [adminHash, user.id]);
      user.password_hash = adminHash;
    }
  }
  if (user && bcrypt.compareSync(password, user.password_hash)) {
    (req.session as any).userId = user.id;
    return res.redirect("/");
  }
  return res.redirect("/login?error=1");
});

router.get("/register", (req, res) => {
  res.render("register", { error: req.query.error === "1" });
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  const hash = bcrypt.hashSync(password, 10);
  try {
    const inserted = await q<{ id: string }>(
      "insert into users(email,password_hash) values($1,$2) returning id",
      [email, hash]
    );
    (req.session as any).userId = inserted[0].id;
    res.redirect("/");
  } catch {
    res.redirect("/register?error=1");
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

export default router;
