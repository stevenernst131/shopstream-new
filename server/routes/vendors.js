const { Router } = require('express');
const { getVendors, getVendorById, getVendorProducts, getVendorScorecardsAll, getVendorScorecard } = require('../db/queries');

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await getVendors();
    res.json({ vendors: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/scorecards', async (req, res) => {
  try {
    const result = await getVendorScorecardsAll();
    res.json({ scorecards: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const vendor = await getVendorById(req.params.id);
    if (!vendor.rows.length) return res.status(404).json({ error: 'Vendor not found' });

    const products = await getVendorProducts(req.params.id);
    res.json({ vendor: vendor.rows[0], products: products.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/scorecard', async (req, res) => {
  try {
    const result = await getVendorScorecard(req.params.id);
    if (!result.rows.length) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ scorecard: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
