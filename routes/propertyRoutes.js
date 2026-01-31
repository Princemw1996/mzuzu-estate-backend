const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const controller = require('../controllers/propertyController');

// Public routes
router.get('/', controller.getProperties);
router.get('/:id', controller.getPropertyById);

// Admin routes (protected)
router.post(
  '/',
  auth,
  controller.upload.array('images', 5),
  controller.addProperty
);

router.get('/admin/all', auth, controller.getAdminProperties);
router.delete('/:id', auth, controller.deleteProperty);

module.exports = router;