const express = require('express');
const router = express.Router();
const { getAuthUrl, getUserInfo } = require('../config/oauth');

// ─── Redirect to Google login ─────────────────────────────────────────────────
router.get('/login', (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// ─── OAuth2 callback ──────────────────────────────────────────────────────────
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`${process.env.CLIENT_URL}/?error=access_denied`);
  }

  try {
    const { user, tokens } = await getUserInfo(code);

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
    };
    req.session.tokens = tokens;

    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/?error=auth_failed`);
  }
});

// ─── Get current user ─────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ user: null });
  }
  res.json({ user: req.session.user });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;