const db = require('../config/db');

const sendInquiry = (req, res) => {
  const { property_id, client_name, client_phone, message, client_email } = req.body;

  if (!property_id || !client_name || !client_phone || !message) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  db.query(
    `INSERT INTO inquiries 
    (property_id, client_name, client_phone, message, client_email, status)
    VALUES (?, ?, ?, ?, ?, 'new')`,
    [property_id, client_name, client_phone, message, client_email || null],
    (err) => {
      if (err) {
        console.error('Error sending inquiry:', err);
        return res.status(500).json({ message: 'Error sending inquiry' });
      }
      res.json({ message: 'Inquiry sent successfully' });
    }
  );
};

const getInquiries = (req, res) => {
  db.query(
    `SELECT i.*, p.title as property_title 
     FROM inquiries i
     LEFT JOIN properties p ON i.property_id = p.id
     ORDER BY i.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error('Error fetching inquiries:', err);
        return res.status(500).json({ message: 'Error fetching inquiries' });
      }
      res.json(results);
    }
  );
};

const updateInquiry = (req, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  db.query(
    `UPDATE inquiries SET status = ?, remarks = ? WHERE id = ?`,
    [status, remarks, id],
    (err) => {
      if (err) {
        console.error('Error updating inquiry:', err);
        return res.status(500).json({ message: 'Error updating inquiry' });
      }
      res.json({ message: 'Inquiry updated successfully' });
    }
  );
};

module.exports = {
  sendInquiry,
  getInquiries,
  updateInquiry
};