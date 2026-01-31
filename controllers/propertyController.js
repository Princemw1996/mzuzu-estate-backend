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
  limits: { fileSize: 5 * 1024 * 1024 },
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
const addProperty = async (req, res) => {
  try {
    const { 
      title, 
      property_type, 
      price, 
      location, 
      description, 
      bedrooms = 0, 
      bathrooms = 0, 
      size = '', 
      features = '', 
      status = 'Available' 
    } = req.body;
    
    const created_by = req.user?.id || 1;

    console.log('Adding property:', { title, property_type, price, location });

    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Insert property
      const propertyResult = await client.query(
        `INSERT INTO properties 
         (title, property_type, price, location, description, bedrooms, bathrooms, size, features, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [title, property_type, price, location, description, bedrooms, bathrooms, size, features, status, created_by]
      );

      const propertyId = propertyResult.rows[0].id;
      console.log('Property created with ID:', propertyId);

      // Save image URLs if files are uploaded
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await client.query(
            `INSERT INTO property_images (property_id, image_url)
             VALUES ($1, $2)`,
            [propertyId, file.filename]
          );
          console.log('Image saved:', file.filename);
        }
      }

      await client.query('COMMIT');
      
      res.json({ 
        success: true,
        message: 'Property added successfully',
        propertyId 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error adding property:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error adding property',
      error: error.message 
    });
  }
};

/* =========================
   GET PROPERTIES (PUBLIC)
========================= */
const getProperties = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, 
       (SELECT image_url FROM property_images WHERE property_id = p.id LIMIT 1) as thumbnail
       FROM properties p
       WHERE p.status = 'Available'
       ORDER BY p.created_at DESC`
    );
    
    console.log('Fetched properties:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching properties' 
    });
  }
};

/* =========================
   GET PROPERTY BY ID (PUBLIC)
========================= */
const getPropertyById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const propertyResult = await db.query(
      `SELECT p.* FROM properties p WHERE p.id = $1 AND p.status = 'Available'`,
      [id]
    );
    
    if (propertyResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Property not found' 
      });
    }
    
    const property = propertyResult.rows[0];
    
    // Get property images
    const imageResult = await db.query(
      `SELECT image_url FROM property_images WHERE property_id = $1`,
      [id]
    );
    
    property.images = imageResult.rows.map(img => ({ image_url: img.image_url }));
    res.json(property);
    
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching property' 
    });
  }
};

/* =========================
   GET ALL PROPERTIES (ADMIN)
========================= */
const getAdminProperties = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, 
       (SELECT COUNT(*) FROM inquiries i WHERE i.property_id = p.id) as inquiry_count
       FROM properties p
       ORDER BY p.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching admin properties:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching properties' 
    });
  }
};

/* =========================
   DELETE PROPERTY (ADMIN)
========================= */
const deleteProperty = async (req, res) => {
  const { id } = req.params;
  
  try {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete images
      await client.query(
        'DELETE FROM property_images WHERE property_id = $1',
        [id]
      );
      
      // Delete property
      await client.query(
        'DELETE FROM properties WHERE id = $1',
        [id]
      );
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true,
        message: 'Property deleted successfully' 
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting property' 
    });
  }
};

module.exports = {
  upload,
  addProperty,
  getProperties,
  getPropertyById,
  getAdminProperties,
  deleteProperty
};