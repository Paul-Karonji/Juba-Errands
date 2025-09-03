const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.get('/statistics', dashboardController.getStatistics);
router.get('/revenue', dashboardController.getRevenueSummary);
router.get('/status-breakdown', dashboardController.getStatusBreakdown);
router.get('/recent-shipments', dashboardController.getRecentShipments);

module.exports = router;