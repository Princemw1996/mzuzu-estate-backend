const db = require('../config/db');
const multer = require('multer');
const path = require('path');

/* =========================
   MULTER CONFIG
========================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

/* =========================
   ADD PROPERTY (ADMIN)
========================= */
const addProperty = (req, res) => {
  const { title, property_type, price, location, description } = req.body;
  const created_by = req.user.id;

  db.query(
    `INSERT INTO properties 
     (title, property_type, price, location, description, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, property_type, price, location, description, created_by],
    (err, result) => {
      if (err) {
        console.error('Error adding property:', err);
        return res.status(500).json({ message: 'Error adding property' });
      }

      const propertyId = result.insertId;

      // Save image URLs if files are uploaded
      if (req.files && req.files.length > 0) {
        const imageQueries = req.files.map(file => {
          return new Promise((resolve, reject) => {
            db.query(
              `INSERT INTO property_images (property_id, image_url)
               VALUES (?, ?)`,
              [propertyId, file.filename],
              (err) => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });

        Promise.all(imageQueries)
          .then(() => {
            res.json({ 
              message: 'Property added successfully',
              propertyId 
            });
          })
          .catch(error => {
            console.error('Error saving images:', error);
            res.status(500).json({ message: 'Error saving images' });
          });
      } else {
        res.json({ 
          message: 'Property added successfully',
          propertyId 
        });
      }
    }
  );
};

/* =========================
   GET PROPERTIES (PUBLIC)
========================= */
const getProperties = (req, res) => {
  db.query(
    `SELECT p.*, 
     (SELECT image_url FROM property_images WHERE property_id = p.id LIMIT 1) as thumbnail
     FROM properties p
     WHERE p.status = 'Available'
     ORDER BY p.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('Error fetching properties:', err);
        return res.status(500).json({ message: 'Error fetching properties' });
      }
      res.json(results);
    }
  );
};

/* =========================
   GET PROPERTY BY ID (PUBLIC)
========================= */
const getPropertyById = (req, res) => {
  const { id } = req.params;
  
  db.query(
    `SELECT p.* FROM properties p WHERE p.id = ? AND p.status = 'Available'`,
    [id],
    (err, propertyResult) => {
      if (err) {
        console.error('Error fetching property:', err);
        return res.status(500).json({ message: 'Error fetching property' });
      }
      
      if (propertyResult.length === 0) {
        return res.status(404).json({ message: 'Property not found' });
      }
      
      const property = propertyResult[0];
      
      // Get property images
      db.query(
        `SELECT image_url FROM property_images WHERE property_id = ?`,
        [id],
        (err, imageResults) => {
          if (err) {
            console.error('Error fetching property images:', err);
            return res.status(500).json({ message: 'Error fetching property images' });
          }
          
          property.images = imageResults.map(img => ({ image_url: img.image_url }));
          res.json(property);
        }
      );
    }
  );
};

/* =========================
   GET ALL PROPERTIES (ADMIN)
========================= */
const getAdminProperties = (req, res) => {
  db.query(
    `SELECT p.*, 
     (SELECT COUNT(*) FROM inquiries i WHERE i.property_id = p.id) as inquiry_count
     FROM properties p
     ORDER BY p.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('Error fetching admin properties:', err);
        return res.status(500).json({ message: 'Error fetching properties' });
      }
      res.json(results);
    }
  );
};

/* =========================
   DELETE PROPERTY (ADMIN)
========================= */
const deleteProperty = (req, res) => {
  const { id } = req.params;
  
  // First delete images
  db.query('DELETE FROM property_images WHERE property_id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting property images:', err);
      return res.status(500).json({ message: 'Error deleting property' });
    }
    
    // Then delete property
    db.query('DELETE FROM properties WHERE id = ?', [id], (err) => {
      if (err) {
        console.error('Error deleting property:', err);
        return res.status(500).json({ message: 'Error deleting property' });
      }
      res.json({ message: 'Property deleted successfully' });
    });
  });
};

/* =========================
   EXPORT EVERYTHING
========================= */
module.exports = {
  upload,
  addProperty,
  getProperties,
  getPropertyById,
  getAdminProperties,
  deleteProperty
};