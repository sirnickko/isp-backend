// 1. Import required packages
require('dotenv').config(); // Loads variables from .env file
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 2. Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Set up Middleware
app.use(cors()); // Allows your future React app to communicate with this API
app.use(express.json()); // Allows the server to read JSON data from incoming requests

// 4. Create Database Connection Pool
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 5. Test the Database Connection
db.getConnection((err, connection) => {
    if (err) {
        console.error(' Database connection failed:', err.message);
    } else {
        console.log(' Database connection successful!');
        connection.release(); // Release the connection back to the pool
    }
});

// 6. Create a simple test route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the ISP Management API!' });
});

// 7. Start the Server
app.listen(PORT, () => {
    console.log(` Server is running on http://localhost:${PORT}`);
});// --- API ROUTES ---
// --- MIDDLEWARE ---

// Verify JWT Token
const authenticateToken = (req, res, next) => {
    // 1. Look for the token in the request headers
    const authHeader = req.headers['authorization'];
    
    // Tokens usually come in the format: "Bearer [actual_token_here]"
    const token = authHeader && authHeader.split(' ')[1]; 

    // 2. If there is no token, kick them out
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided. Please log in.' });
    }

    // 3. If there is a token, verify it's real and hasn't expired
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        
        // 4. Token is good! Attach the user's data to the request and let them through
        req.user = user; 
        next(); 
    });
};

// 1. Register a new user (Community, ISP, or Admin)
app.post('/api/register', async (req, res) => {
    // 1. Grab the data sent from the frontend
    const { full_name, email, password, role, phone_number } = req.body;

    // 2. Check if the user filled in all required fields
    if (!full_name || !email || !password || !role) {
        return res.status(400).json({ error: 'Please provide all required fields.' });
    }

    try {
        // 3. Hash the password for security
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. Insert the new user into the MySQL database
        const query = `
            INSERT INTO Users (full_name, email, password_hash, role, phone_number) 
            VALUES (?, ?, ?, ?, ?)
        `;
        
        db.query(query, [full_name, email, password_hash, role, phone_number], (err, result) => {
            if (err) {
                // If email already exists, MySQL throws an error
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Email is already registered.' });
                }
                console.error(err);
                return res.status(500).json({ error: 'Database error.' });
            }
            
            // 5. Success! Send a response back to the frontend
            res.status(201).json({ 
                message: 'User registered successfully!', 
                userId: result.insertId 
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error during registration.' });
    }
});
// 2. User Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // 1. Check if email and password are provided
    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password.' });
    }

    // 2. Find the user in the database
    const query = 'SELECT * FROM Users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error.' });

        // 3. Check if the user exists
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = results[0];

        // 4. Compare the typed password with the hashed password in the DB
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // 5. Success! Generate a JWT Token
        // This token contains the user's ID and Role, allowing them to access restricted areas
        const token = jwt.sign(
            { userId: user.user_id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '24h' } // The user will be logged out after 24 hours
        );

        // 6. Send the token and user info back to the frontend
        res.json({
            message: 'Login successful!',
            token: token,
            user: {
                id: user.user_id,
                name: user.full_name,
                role: user.role
            }
        });
    });
});

// 2b. Get Users (Protected: ISP/Admin can fetch Community users)
app.get('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'ISP' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied.' });
    }
    const role = req.query.role || 'Community';
    db.query('SELECT user_id, full_name, email, phone_number FROM Users WHERE role = ?', [role], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.json(results);
    });
});
// 3. Add Internet Package (Protected: Only ISPs and Admins)
app.post('/api/packages', authenticateToken, (req, res) => {
    
    // 1. Security Check: Are they an ISP or Admin?
    if (req.user.role !== 'ISP' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Only ISPs can create packages.' });
    }

    // 2. Grab the package details from the request
    const { package_name, speed_mbps, price } = req.body;
    
    // Notice how we get the ISP's ID directly from the secure token, NOT from the frontend!
    // This prevents a hacker from pretending to add a package for a different company.
    const isp_id = req.user.userId; 

    if (!package_name || !speed_mbps || !price) {
        return res.status(400).json({ error: 'Please provide package name, speed, and price.' });
    }

    // 3. Save to database
    const query = 'INSERT INTO Internet_Packages (isp_id, package_name, speed_mbps, price) VALUES (?, ?, ?, ?)';
    
    db.query(query, [isp_id, package_name, speed_mbps, price], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error while saving package.' });
        }
        
        res.status(201).json({ 
            message: 'Internet package created successfully!', 
            packageId: result.insertId 
        });
    });
});

// 4. Get all packages (Public: Anyone can view available packages)
app.get('/api/packages', (req, res) => {
    const query = `
        SELECT p.package_id, p.isp_id, p.package_name, p.speed_mbps, p.price, u.full_name AS provider_name 
        FROM Internet_Packages p
        JOIN Users u ON p.isp_id = u.user_id
    `;
    
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        res.json(results);
    });
});

// =============================================================================
// --- INSTALLATION REQUEST ROUTES ---
// =============================================================================

// 5. Submit an Installation Request (Protected: Community Users only)
// A community user picks an ISP and a package, then submits a request.
app.post('/api/installations', authenticateToken, (req, res) => {

    // 1. Only Community users and ISPs can submit installation requests
    if (req.user.role !== 'Community' && req.user.role !== 'ISP') {
        return res.status(403).json({ error: 'Access denied. Only Community users and ISPs can submit installation requests.' });
    }

    let customer_id;
    let isp_id;

    if (req.user.role === 'Community') {
        customer_id = req.user.userId;
        isp_id = req.body.isp_id;
    } else {
        customer_id = req.body.customer_id;
        isp_id = req.user.userId;
    }
    const { package_id } = req.body;

    // 2. Validate required fields
    if (!isp_id || !package_id) {
        return res.status(400).json({ error: 'Please provide isp_id and package_id.' });
    }

    // 3. Verify that the chosen package actually belongs to the chosen ISP
    //    This prevents a user from mixing up packages and providers.
    const verifyQuery = 'SELECT package_id FROM Internet_Packages WHERE package_id = ? AND isp_id = ?';
    db.query(verifyQuery, [package_id, isp_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error during package verification.' });

        if (results.length === 0) {
            return res.status(400).json({ error: 'The selected package does not belong to the specified ISP.' });
        }

        // 4. Insert the new installation request (status defaults to 'Pending')
        const insertQuery = `
            INSERT INTO Installation_Requests (customer_id, isp_id, package_id, status)
            VALUES (?, ?, ?, 'Pending')
        `;
        db.query(insertQuery, [customer_id, isp_id, package_id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error while submitting installation request.' });
            }

            res.status(201).json({
                message: 'Installation request submitted successfully! The ISP will review it shortly.',
                requestId: result.insertId
            });
        });
    });
});

// 6. Get Installation Requests (Protected: ISP sees their own; Community sees their own)
app.get('/api/installations', authenticateToken, (req, res) => {

    let query;
    let queryParams;

    if (req.user.role === 'ISP') {
        // ISP sees all requests directed at them
        query = `
            SELECT 
                ir.request_id, ir.status, ir.isp_id,
                u.full_name AS customer_name, u.email AS customer_email, u.phone_number AS customer_phone,
                p.package_name, p.speed_mbps, p.price
            FROM Installation_Requests ir
            JOIN Users u ON ir.customer_id = u.user_id
            JOIN Internet_Packages p ON ir.package_id = p.package_id
            WHERE ir.isp_id = ?
            ORDER BY ir.request_id DESC
        `;
        queryParams = [req.user.userId];
    } else if (req.user.role === 'Community') {
        // Community user sees their own submitted requests
        query = `
            SELECT 
                ir.request_id, ir.status,
                isp.full_name AS isp_name,
                p.package_name, p.speed_mbps, p.price
            FROM Installation_Requests ir
            JOIN Users isp ON ir.isp_id = isp.user_id
            JOIN Internet_Packages p ON ir.package_id = p.package_id
            WHERE ir.customer_id = ?
            ORDER BY ir.request_id DESC
        `;
        queryParams = [req.user.userId];
    } else if (req.user.role === 'Admin') {
        // Admin sees everything
        query = `
            SELECT 
                ir.request_id, ir.status,
                u.full_name AS customer_name,
                isp.full_name AS isp_name,
                p.package_name, p.speed_mbps, p.price
            FROM Installation_Requests ir
            JOIN Users u ON ir.customer_id = u.user_id
            JOIN Users isp ON ir.isp_id = isp.user_id
            JOIN Internet_Packages p ON ir.package_id = p.package_id
            ORDER BY ir.request_id DESC
        `;
        queryParams = [];
    } else {
        return res.status(403).json({ error: 'Access denied.' });
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error while fetching installation requests.' });
        }
        res.json(results);
    });
});

// 7. Update Installation Request Status (Protected: ISP / Admin)
//
// ★ KEY BEHAVIOR: When an ISP sets status to 'Installed', this route uses a
//   database TRANSACTION to atomically:
//     a) Update the installation row
//     b) Create an Active Subscription row (with idempotency guard)
//   If either step fails, BOTH are rolled back — no orphaned data ever.
app.patch('/api/installations/:id/status', authenticateToken, (req, res) => {

    // 1. Role guard
    if (req.user.role !== 'ISP' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Only ISPs can update installation statuses.' });
    }

    const requestId = req.params.id;
    const { status } = req.body;

    // 2. Validate against DB ENUM values
    const allowedStatuses = ['Pending', 'Approved', 'Installed', 'Rejected'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}.` });
    }

    // 3. Fetch the installation record first so we have customer_id and package_id
    //    ISPs can only touch their own requests; Admins can touch any.
    const ownershipWhere = req.user.role === 'ISP' ? ' AND isp_id = ?' : '';
    const fetchParams   = req.user.role === 'ISP' ? [requestId, req.user.userId] : [requestId];

    db.query(
        `SELECT * FROM Installation_Requests WHERE request_id = ?${ownershipWhere}`,
        fetchParams,
        (err, rows) => {
            if (err) { console.error(err); return res.status(500).json({ error: 'Database error.' }); }
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Installation request not found or you do not have permission to update it.' });
            }

            const installRequest = rows[0];

            // 4. For any status OTHER than 'Installed', a plain UPDATE is sufficient
            if (status !== 'Installed') {
                db.query(
                    'UPDATE Installation_Requests SET status = ? WHERE request_id = ?',
                    [status, requestId],
                    (err) => {
                        if (err) { console.error(err); return res.status(500).json({ error: 'Database error while updating installation status.' }); }
                        return res.json({ message: `Installation request #${requestId} status updated to '${status}'.` });
                    }
                );
                return; // exit early — no subscription work needed
            }

            // 5. Status IS 'Installed' — acquire a connection and open a transaction
            db.getConnection((err, connection) => {
                if (err) { console.error(err); return res.status(500).json({ error: 'Could not acquire a database connection.' }); }

                connection.beginTransaction(err => {
                    if (err) {
                        connection.release();
                        return res.status(500).json({ error: 'Could not start database transaction.' });
                    }

                    // STEP A — Update the installation row
                    connection.query(
                        'UPDATE Installation_Requests SET status = ? WHERE request_id = ?',
                        ['Installed', requestId],
                        (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error('TX rollback (step A):', err);
                                    res.status(500).json({ error: 'Transaction failed: could not update installation status.' });
                                });
                            }

                            // STEP B — Idempotency check: does a subscription already exist?
                            connection.query(
                                'SELECT subscription_id FROM Subscriptions WHERE customer_id = ? AND package_id = ?',
                                [installRequest.customer_id, installRequest.package_id],
                                (err, existing) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error('TX rollback (step B):', err);
                                            res.status(500).json({ error: 'Transaction failed: subscription check error.' });
                                        });
                                    }

                                    if (existing.length > 0) {
                                        // Subscription already exists — commit the status update and return
                                        return connection.commit(err => {
                                            connection.release();
                                            if (err) return res.status(500).json({ error: 'Transaction commit failed.' });
                                            res.json({
                                                message: `Installation #${requestId} marked as Installed. An active subscription already exists.`,
                                                subscriptionId: existing[0].subscription_id
                                            });
                                        });
                                    }

                                    // STEP C — Create the new Active subscription
                                    connection.query(
                                        `INSERT INTO Subscriptions (customer_id, package_id, status, activation_date)
                                         VALUES (?, ?, 'Active', NOW())`,
                                        [installRequest.customer_id, installRequest.package_id],
                                        (err, subResult) => {
                                            if (err) {
                                                return connection.rollback(() => {
                                                    connection.release();
                                                    console.error('TX rollback (step C):', err);
                                                    res.status(500).json({ error: 'Transaction failed: could not create subscription.' });
                                                });
                                            }

                                            // STEP D — Commit both changes atomically
                                            connection.commit(err => {
                                                connection.release();
                                                if (err) return res.status(500).json({ error: 'Transaction commit failed.' });

                                                console.log(`✅ Subscription #${subResult.insertId} auto-created for customer ${installRequest.customer_id}`);
                                                res.json({
                                                    message: `Installation #${requestId} marked as Installed. Subscription activated automatically! 🎉`,
                                                    subscriptionId: subResult.insertId
                                                });
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                });
            });
        }
    );
});

// =============================================================================
// --- COMPLAINT ROUTES ---
// =============================================================================

// 8. Submit a Complaint (Protected: Community Users only)
app.post('/api/complaints', authenticateToken, (req, res) => {

    // 1. Only Community users can submit complaints
    if (req.user.role !== 'Community') {
        return res.status(403).json({ error: 'Access denied. Only Community users can submit complaints.' });
    }

    const customer_id = req.user.userId; // Taken securely from the JWT token
    const { isp_id, issue_type, description } = req.body;

    // 2. Validate required fields
    if (!isp_id || !issue_type || !description) {
        return res.status(400).json({ error: 'Please provide isp_id, issue_type, and description.' });
    }

    // 3. Verify the ISP actually exists and has the role 'ISP'
    const verifyISP = "SELECT user_id FROM Users WHERE user_id = ? AND role = 'ISP'";
    db.query(verifyISP, [isp_id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error during ISP verification.' });

        if (results.length === 0) {
            return res.status(400).json({ error: 'The specified ISP does not exist.' });
        }

        // 4. Insert the complaint (status defaults to 'Open')
        const insertQuery = `
            INSERT INTO Complaints (customer_id, isp_id, issue_type, description, status)
            VALUES (?, ?, ?, ?, 'Open')
        `;
        db.query(insertQuery, [customer_id, isp_id, issue_type, description], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error while submitting complaint.' });
            }

            res.status(201).json({
                message: 'Complaint submitted successfully! The ISP will be notified.',
                complaintId: result.insertId
            });
        });
    });
});

// 9. Get Complaints (Protected: ISP sees their own; Community sees their own; Admin sees all)
app.get('/api/complaints', authenticateToken, (req, res) => {

    let query;
    let queryParams;

    if (req.user.role === 'ISP') {
        query = `
            SELECT 
                c.complaint_id, c.issue_type, c.description, c.status,
                u.full_name AS customer_name, u.email AS customer_email, u.phone_number AS customer_phone
            FROM Complaints c
            JOIN Users u ON c.customer_id = u.user_id
            WHERE c.isp_id = ?
            ORDER BY c.complaint_id DESC
        `;
        queryParams = [req.user.userId];
    } else if (req.user.role === 'Community') {
        query = `
            SELECT 
                c.complaint_id, c.issue_type, c.description, c.status,
                isp.full_name AS isp_name
            FROM Complaints c
            JOIN Users isp ON c.isp_id = isp.user_id
            WHERE c.customer_id = ?
            ORDER BY c.complaint_id DESC
        `;
        queryParams = [req.user.userId];
    } else if (req.user.role === 'Admin') {
        query = `
            SELECT 
                c.complaint_id, c.issue_type, c.description, c.status,
                u.full_name AS customer_name,
                isp.full_name AS isp_name
            FROM Complaints c
            JOIN Users u ON c.customer_id = u.user_id
            JOIN Users isp ON c.isp_id = isp.user_id
            ORDER BY c.complaint_id DESC
        `;
        queryParams = [];
    } else {
        return res.status(403).json({ error: 'Access denied.' });
    }

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error while fetching complaints.' });
        }
        res.json(results);
    });
});

// 10. Update Complaint Status (Protected: ISP only)
// ISP can move a complaint from Open → In Progress → Resolved.
app.patch('/api/complaints/:id/status', authenticateToken, (req, res) => {

    // 1. Only ISPs (and Admins) can update complaint statuses
    if (req.user.role !== 'ISP' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Only ISPs can update complaint statuses.' });
    }

    const complaintId = req.params.id;
    const { status } = req.body;

    // 2. Validate against allowed ENUM values in the DB schema
    const allowedStatuses = ['Open', 'In Progress', 'Resolved'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}.` });
    }

    // 3. ISPs can only update complaints assigned to themselves (ownership check)
    const ownershipCheck = req.user.role === 'ISP' ? ' AND isp_id = ?' : '';
    const queryParams = req.user.role === 'ISP'
        ? [status, complaintId, req.user.userId]
        : [status, complaintId];

    const query = `UPDATE Complaints SET status = ? WHERE complaint_id = ?${ownershipCheck}`;

    db.query(query, queryParams, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error while updating complaint status.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Complaint not found or you do not have permission to update it.' });
        }

        res.json({ message: `Complaint #${complaintId} status updated to '${status}'.` });
    });
});

// =============================================================================
// --- SUBSCRIPTION ROUTES ---
// =============================================================================

// 11. Get Subscriptions — role-scoped view
//   Community → own subscriptions only
//   ISP       → all subscribers on their packages
//   Admin     → full platform view
app.get('/api/subscriptions', authenticateToken, (req, res) => {
    let query, queryParams;

    if (req.user.role === 'Community') {
        query = `
            SELECT
                s.subscription_id,
                s.status,
                s.activation_date,
                p.package_name,
                p.speed_mbps,
                p.price,
                isp.full_name AS isp_name
            FROM Subscriptions s
            JOIN Internet_Packages p  ON s.package_id  = p.package_id
            JOIN Users            isp ON p.isp_id       = isp.user_id
            WHERE s.customer_id = ?
            ORDER BY s.subscription_id DESC
        `;
        queryParams = [req.user.userId];

    } else if (req.user.role === 'ISP') {
        query = `
            SELECT
                s.subscription_id,
                s.status,
                s.activation_date,
                p.package_name,
                p.speed_mbps,
                p.price,
                u.full_name    AS customer_name,
                u.email        AS customer_email,
                u.phone_number AS customer_phone
            FROM Subscriptions s
            JOIN Internet_Packages p ON s.package_id = p.package_id
            JOIN Users             u ON s.customer_id = u.user_id
            WHERE p.isp_id = ?
            ORDER BY s.subscription_id DESC
        `;
        queryParams = [req.user.userId];

    } else if (req.user.role === 'Admin') {
        query = `
            SELECT
                s.subscription_id,
                s.status,
                s.activation_date,
                p.package_name,
                p.speed_mbps,
                p.price,
                u.full_name   AS customer_name,
                isp.full_name AS isp_name
            FROM Subscriptions s
            JOIN Internet_Packages p   ON s.package_id  = p.package_id
            JOIN Users             u   ON s.customer_id = u.user_id
            JOIN Users             isp ON p.isp_id      = isp.user_id
            ORDER BY s.subscription_id DESC
        `;
        queryParams = [];

    } else {
        return res.status(403).json({ error: 'Access denied.' });
    }

    db.query(query, queryParams, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Database error while fetching subscriptions.' }); }
        res.json(results);
    });
});

// 11b. Update Subscription Status (Protected: ISP / Admin)
app.patch('/api/subscriptions/:id/status', authenticateToken, (req, res) => {
    if (req.user.role !== 'ISP' && req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Only ISPs can update subscription statuses.' });
    }

    const subscriptionId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ['Active', 'Suspended'];
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}.` });
    }

    const ownershipCheck = req.user.role === 'ISP' ? ` AND package_id IN (SELECT package_id FROM Internet_Packages WHERE isp_id = ?)` : '';
    const queryParams = req.user.role === 'ISP' ? [status, subscriptionId, req.user.userId] : [status, subscriptionId];

    db.query(
        `UPDATE Subscriptions SET status = ? WHERE subscription_id = ?${ownershipCheck}`,
        queryParams,
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error while updating subscription status.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Subscription not found or you do not have permission.' });
            }
            res.json({ message: `Subscription #${subscriptionId} status updated to '${status}'.` });
        }
    );
});

// =============================================================================
// --- PAYMENT ROUTES ---
// =============================================================================

// 12. Record a Payment (Protected: Community only)
//
// Security model:
//   • customer_id is pulled from the JWT — never from the request body.
//   • We verify the subscription_id belongs to the authenticated user.
//   • We verify the subscription is 'Active' — suspended accounts cannot pay
//     their way back in without admin reactivation.
//   • transaction_ref has a UNIQUE DB constraint, so duplicate submissions
//     are caught at the DB level (ER_DUP_ENTRY).
app.post('/api/payments', authenticateToken, (req, res) => {
    if (req.user.role !== 'Community' && req.user.role !== 'ISP') {
        return res.status(403).json({ error: 'Access denied. Only subscribers or ISPs can record payments.' });
    }

    const { subscription_id, amount, payment_method, transaction_ref } = req.body;

    // 1. Validate required fields
    if (!subscription_id || !amount || !payment_method || !transaction_ref) {
        return res.status(400).json({ error: 'Please provide subscription_id, amount, payment_method, and transaction_ref.' });
    }
    if (isNaN(amount) || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    // 2. Ownership + status verification
    let verifyQuery, verifyParams;
    if (req.user.role === 'Community') {
        verifyQuery = 'SELECT subscription_id, status FROM Subscriptions WHERE subscription_id = ? AND customer_id = ?';
        verifyParams = [subscription_id, req.user.userId];
    } else {
        verifyQuery = `
            SELECT s.subscription_id, s.status 
            FROM Subscriptions s
            JOIN Internet_Packages p ON s.package_id = p.package_id
            WHERE s.subscription_id = ? AND p.isp_id = ?
        `;
        verifyParams = [subscription_id, req.user.userId];
    }

    db.query(
        verifyQuery,
        verifyParams,
        (err, results) => {
            if (err) { console.error(err); return res.status(500).json({ error: 'Database error during subscription verification.' }); }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Subscription not found or does not belong to you.' });
            }

            if (results[0].status !== 'Active') {
                return res.status(400).json({
                    error: `Cannot record a payment for a '${results[0].status}' subscription. Please contact your ISP to reactivate your service.`
                });
            }

            // 3. Insert the payment record
            db.query(
                'INSERT INTO Payments (subscription_id, amount, payment_method, transaction_ref) VALUES (?, ?, ?, ?)',
                [subscription_id, amount, payment_method, transaction_ref],
                (err, result) => {
                    if (err) {
                        // Catch duplicate transaction reference at DB level
                        if (err.code === 'ER_DUP_ENTRY') {
                            return res.status(400).json({ error: 'Duplicate transaction: this reference has already been recorded.' });
                        }
                        console.error(err);
                        return res.status(500).json({ error: 'Database error while recording payment.' });
                    }

                    res.status(201).json({
                        message: 'Payment recorded successfully! ✅',
                        paymentId: result.insertId
                    });
                }
            );
        }
    );
});

// 13. Get Payment History — role-scoped view
app.get('/api/payments', authenticateToken, (req, res) => {
    let query, queryParams;

    if (req.user.role === 'Community') {
        query = `
            SELECT
                pay.payment_id,
                pay.amount,
                pay.payment_method,
                pay.transaction_ref,
                p.package_name,
                s.status AS subscription_status
            FROM Payments pay
            JOIN Subscriptions      s ON pay.subscription_id = s.subscription_id
            JOIN Internet_Packages  p ON s.package_id        = p.package_id
            WHERE s.customer_id = ?
            ORDER BY pay.payment_id DESC
        `;
        queryParams = [req.user.userId];

    } else if (req.user.role === 'ISP') {
        query = `
            SELECT
                pay.payment_id,
                pay.amount,
                pay.payment_method,
                pay.transaction_ref,
                p.package_name,
                u.full_name AS customer_name
            FROM Payments pay
            JOIN Subscriptions      s ON pay.subscription_id = s.subscription_id
            JOIN Internet_Packages  p ON s.package_id        = p.package_id
            JOIN Users              u ON s.customer_id       = u.user_id
            WHERE p.isp_id = ?
            ORDER BY pay.payment_id DESC
        `;
        queryParams = [req.user.userId];

    } else if (req.user.role === 'Admin') {
        query = `
            SELECT
                pay.payment_id,
                pay.amount,
                pay.payment_method,
                pay.transaction_ref,
                p.package_name,
                u.full_name   AS customer_name,
                isp.full_name AS isp_name
            FROM Payments pay
            JOIN Subscriptions      s   ON pay.subscription_id = s.subscription_id
            JOIN Internet_Packages  p   ON s.package_id        = p.package_id
            JOIN Users              u   ON s.customer_id       = u.user_id
            JOIN Users              isp ON p.isp_id            = isp.user_id
            ORDER BY pay.payment_id DESC
        `;
        queryParams = [];

    } else {
        return res.status(403).json({ error: 'Access denied.' });
    }

    db.query(query, queryParams, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ error: 'Database error while fetching payments.' }); }
        res.json(results);
    });
});

// =============================================================================
// --- ADMIN: OVERDUE SUBSCRIPTION SUSPENSION ---
// =============================================================================

// Core suspension logic — extracted into a named function so it can be called
// both from the admin HTTP route AND from the internal 24-hour scheduler.
//
// Overdue Rule (MVP):
//   An 'Active' subscription is considered overdue when its activation_date is
//   more than 30 days in the past AND no payment has ever been recorded for it.
//
// ℹ️  Future Enhancement: Add a `paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
//   column to the Payments table. Then replace the NOT IN subquery with:
//   "HAVING DATEDIFF(NOW(), MAX(paid_at)) > 30"  to support multi-cycle billing.
function suspendOverdueSubscriptions(callback) {
    const query = `
        UPDATE Subscriptions
        SET    status = 'Suspended'
        WHERE  status = 'Active'
          AND  activation_date < DATE_SUB(NOW(), INTERVAL 30 DAY)
          AND  subscription_id NOT IN (
                   SELECT DISTINCT subscription_id FROM Payments
               )
    `;

    db.query(query, (err, result) => {
        if (err) {
            console.error('⚠️  Overdue suspension job failed:', err.message);
            if (callback) callback(err, null);
            return;
        }

        const count = result.affectedRows;
        if (count > 0) {
            console.log(`🔴 Suspended ${count} overdue subscription(s).`);
        } else {
            console.log('✅ Overdue check complete — no subscriptions to suspend.');
        }

        if (callback) callback(null, count);
    });
}

// 14. Manual Trigger / Webhook — Admin only
//   Useful for: forcing an immediate run via Postman, calling from an external
//   cron service, or triggering during testing.
app.post('/api/admin/suspend-overdue', authenticateToken, (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    suspendOverdueSubscriptions((err, count) => {
        if (err) return res.status(500).json({ error: 'Suspension job encountered a database error.' });
        res.json({
            message: count > 0
                ? `Suspension complete. ${count} overdue subscription(s) have been suspended.`
                : 'All subscriptions are up to date. Nothing to suspend.',
            suspendedCount: count
        });
    });
});

// =============================================================================
// 15. Get Admin Dashboard Analytics (Protected: Admin only)
// Provides a platform-wide overview: Active Subs, Total Revenue, Open Complaints, and ISP Rankings
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Access denied. Admins only.' });
    }

    try {
        // Use the promise wrapper for cleaner async/await syntax with multiple queries
        const pool = db.promise();
        
        // 1. Total Active Subscriptions
        const [activeSubsRes] = await pool.query(
            "SELECT COUNT(*) AS total_active FROM Subscriptions WHERE status = 'Active'"
        );
        
        // 2. Total Revenue (all time, since Payments table lacks a created_at timestamp MVP)
        const [revenueRes] = await pool.query(
            "SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM Payments"
        );
        
        // 3. Count of Open Complaints
        const [openComplaintsRes] = await pool.query(
            "SELECT COUNT(*) AS open_complaints FROM Complaints WHERE status = 'Open'"
        );
        
        // 4. ISP Performance Rankings (Active subs per ISP)
        const [ispRankingsRes] = await pool.query(`
            SELECT 
                u.user_id,
                u.full_name AS isp_name, 
                COUNT(s.subscription_id) AS active_subscriptions 
            FROM Users u 
            LEFT JOIN Internet_Packages p ON u.user_id = p.isp_id 
            LEFT JOIN Subscriptions s ON p.package_id = s.package_id AND s.status = 'Active' 
            WHERE u.role = 'ISP' 
            GROUP BY u.user_id 
            ORDER BY active_subscriptions DESC
        `);

        res.json({
            metrics: {
                totalActiveSubscriptions: activeSubsRes[0].total_active,
                totalRevenue: Number(revenueRes[0].total_revenue),
                openComplaints: openComplaintsRes[0].open_complaints
            },
            ispRankings: ispRankingsRes
        });

    } catch (error) {
        console.error('Error fetching admin dashboard data:', error);
        res.status(500).json({ error: 'Database error while fetching dashboard analytics.' });
    }
});

// =============================================================================
// --- SCHEDULED TASK: DAILY OVERDUE CHECK ---
// =============================================================================
//
// Runs suspendOverdueSubscriptions() every 24 hours automatically.
// No external cron manager (e.g., cron, node-cron) required.
//
// ★ Fires once immediately on startup to clear any backlog built up while
//   the server was down, then repeats every 24 hours.

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function startOverdueSubscriptionScheduler() {
    console.log('🕐 Overdue subscription scheduler started (runs every 24 hours).');

    // Run immediately on boot
    suspendOverdueSubscriptions();

    // Then run every 24 hours
    setInterval(suspendOverdueSubscriptions, TWENTY_FOUR_HOURS_MS);
}

// Kick off the scheduler — the db pool must be ready before we start,
// so we trigger it after the connection test at startup.
db.getConnection((err, connection) => {
    if (!err) {
        connection.release();
        startOverdueSubscriptionScheduler();
    }
    // If the connection fails, the earlier db.getConnection block already logged it.
});