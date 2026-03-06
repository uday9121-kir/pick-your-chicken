const jwt = require('jsonwebtoken');

exports.requireCustomer = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Login required' });
  try {
    req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please login again.' });
  }
};

exports.requireFarm = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Farm login required' });
  try {
    const d = jwt.verify(h.split(' ')[1], process.env.JWT_FARM_SECRET);
    if (d.role !== 'farm_owner') return res.status(403).json({ error: 'Farm owner access only' });
    req.farm = d;
    next();
  } catch {
    res.status(401).json({ error: 'Farm session expired. Please login again.' });
  }
};
