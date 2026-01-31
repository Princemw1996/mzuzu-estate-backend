const db = require('../config/db');

const sendInquiry = async (req, res) => {
  const { property_id, client_name, client_phone, message, client_email } = req.body;

  if (!property_id || !client_name || !client_phone || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await db.query(
      `INSERT INTO inquiries 
      (property_id, client_name, client_phone, message, client_email, status)
      VALUES ($1, $2, $3, $4, $5, 'new')`,
      [property_id, client_name, client_phone, message, client_email || null]
    );
    
    res.json({ 
      success: true,
      message: 'Inquiry sent successfully' 
    });
  } catch (error) {
    console.error('Error sending inquiry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending inquiry' 
    });
  }
};

const getInquiries = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT i.*, p.title as property_title 
       FROM inquiries i
       LEFT JOIN properties p ON i.property_id = p.id
       ORDER BY i.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching inquiries' 
    });
  }
};

const updateInquiry = async (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  try {
    await db.query(
      `UPDATE inquiries SET status = $1, remarks = $2 WHERE id = $3`,
      [status, remarks, id]
    );
    
    res.json({ 
      success: true,
      message: 'Inquiry updated successfully' 
    });
  } catch (error) {
    console.error('Error updating inquiry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating inquiry' 
    });
  }
};

module.exports = {
  sendInquiry,
  getInquiries,
  updateInquiry
};