// Add this to the API server for CV upload functionality

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = './uploads/cvs';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX and TXT files are allowed'));
        }
    }
});

// CV Upload endpoint
app.post('/api/cv/upload', authenticateToken, upload.single('cv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }
        
        const userId = req.user.id;
        const { privacy_level = 'private', description } = req.body;
        
        // Save CV info to database
        const cvQuery = `
            INSERT INTO cv_documents (user_id, filename, file_path, file_size, mime_type, privacy_level, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, filename, uploaded_at
        `;
        
        const result = await pool.query(cvQuery, [
            userId,
            req.file.originalname,
            req.file.path,
            req.file.size,
            req.file.mimetype,
            privacy_level,
            description || null
        ]);
        
        res.json({
            success: true,
            message: 'CV uploaded successfully',
            cv: result.rows[0]
        });
        
    } catch (error) {
        console.error('CV upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload CV'
        });
    }
});

// Get user's CVs
app.get('/api/cv/list', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT id, filename, file_size, mime_type, privacy_level, description, uploaded_at, is_active
            FROM cv_documents
            WHERE user_id = $1
            ORDER BY uploaded_at DESC
        `;
        
        const result = await pool.query(query, [userId]);
        
        res.json({
            success: true,
            cvs: result.rows
        });
        
    } catch (error) {
        console.error('CV list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch CVs'
        });
    }
});

// Delete CV
app.delete('/api/cv/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const cvId = req.params.id;
        
        // Get CV info first
        const cvQuery = await pool.query(
            'SELECT file_path FROM cv_documents WHERE id = $1 AND user_id = $2',
            [cvId, userId]
        );
        
        if (cvQuery.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'CV not found'
            });
        }
        
        // Delete file from disk
        const filePath = cvQuery.rows[0].file_path;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        // Delete from database
        await pool.query('DELETE FROM cv_documents WHERE id = $1 AND user_id = $2', [cvId, userId]);
        
        res.json({
            success: true,
            message: 'CV deleted successfully'
        });
        
    } catch (error) {
        console.error('CV delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete CV'
        });
    }
});

// Middleware to check authentication
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
}

module.exports = { upload, authenticateToken };