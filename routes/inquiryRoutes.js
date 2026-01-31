const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { sendInquiry, getInquiries, updateInquiry } = require('../controllers/inquiryController');

// Public route
router.post('/', sendInquiry);

// Admin routes (protected)
router.get('/admin/inquiries', auth, getInquiries);
router.put('/admin/inquiries/:id', auth, updateInquiry);

module.exports = router;