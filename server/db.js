const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the database directory exists
const databaseDir = path.resolve(__dirname, '../database');
if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
}

// Ensure the database file exists
if (!fs.existsSync(path.join(databaseDir, 'scavenger-hunt.db'))) {
    fs.writeFileSync(path.join(databaseDir, 'scavenger-hunt.db'), '');
}

const dbPath = path.resolve(__dirname, '../database/scavenger-hunt.db');

// Initialize the database
function initializeDatabase() {

    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
            return;
        }
        console.log('Connected to the SQLite database.');
        fs.readFile(path.join(__dirname, 'dbstate', 'initialize.sql'), (err, data) => {
            if (err) {
                console.error("Unable to read db initialization script");
                return;
            }
            db.exec(data.toString())
        });
    });

    return db;

}

// Initialize the database and export it
const db = initializeDatabase()

/**
 * 
 * @param {string} name 
 * @param {string} identifier 
 * @returns {Promise<string>}
 */
function registerUser(name, identifier, is_admin=false) {
    return new Promise((res, rej) => {
        db.run(
            `INSERT INTO users (name, identifier, is_admin) VALUES (?, ?, ?)`,
            [name, identifier, is_admin ? 1 : 0],
            function (err) {
                if (err) {
                    return rej(err);
                }
                res(identifier);
            });
    });
}

/**
 * 
 * @param {string} identifier 
 * @returns {Promise<{name: string}>}
 */
function findUsernameByIdentifier(identifier) {

    return new Promise((res, rej) => {
        db.get(`SELECT name FROM users WHERE identifier = ?`, [identifier], (err, data) => {
            if (err) {
                return rej(err);
            }
            res(data);
        });
    });
}


/**
 * 
 * @param {string} identifier 
 * @returns {Promise<{identifier: string, name: string, is_admin: boolean, completion_code: string}>}
 */
function findUserByIdentifier(identifier) {

    return new Promise((res, rej) => {
        db.get(
            `SELECT * FROM users WHERE identifier = ?`,
            [identifier], (err, data) => {
                if (err) {
                    return rej(err);
                }
                res(data);
            });
    });
}

/**
 * 
 * @param {string} userId 
 * @param {string} tagId 
 * @returns {Promise<boolean>}
 */
function logScan(userId, tagId) {
    const stmt = db.prepare(`INSERT OR IGNORE INTO scans (user_id, tag_id) VALUES (?, ?)`);

    return new Promise((res, rej) => {
        stmt.run(userId, tagId, function (err) {
            if (err) {
                return rej(err);
            }
            res((this?.changes ?? 0) > 0)
        });
    });
}


/**
 * @param {string} userId
 * @returns {Promise<{tag_id: string, timestamp: string}>}
 */
function getUserScans(userId) {
    return new Promise((res, rej) => {
        db.all(`SELECT tag_id, timestamp FROM scans WHERE user_id = ?`, [userId], (err, data) => {
            if (err) {
                return rej(err);
            }
            res(data);
        });
    });
}

/**
 * 
 * @returns {Promise<{name: string, identifier: string, scan_count: number}[]>}
 */
function getUserScanCount(){
     const query = `
      SELECT u.name, u.identifier, COUNT(s.tag_id) as scan_count
        FROM users u
        LEFT JOIN scans s ON u.id = s.user_id
        GROUP BY u.identifier, u.name
        ORDER BY u.name
    `;

    return new Promise((res, rej) => {
        db.all(query, [], (err, data) => {
            if (err) {
                return rej(err);
            }
            res(data);
        });
    });
}

/**
 * 
 * @param {string} userId 
 * @param {string} completionCode 
 * @returns {Promise<void>}
 */
function setUserCompletionCode(userId, completionCode){
    return new Promise((res, rej) => {
        db.run(`UPDATE users SET completion_code = ? WHERE id = ?`, [completionCode, userId], (err) => {
            if (err) {
                return rej(err);
            }
            res();
        });
    });
}


/**
 * 
 * @param {string} code 
 * @returns {Promise<{identifier: string, name: string, is_admin: boolean, completion_code: string}>}
 */
function getUserByCode(code){
    return new Promise((res, rej) => {
        db.get(`SELECT * FROM users WHERE completion_code = ?`, [code], (err) => {
            if (err) {
                return rej(err);
            }
            res();
        });
    });
}

/**
 * 
 * @returns {Promise<{tag_id: string, scan_count: number}>}
 */
function getScansByClue() {
    const query = `
        SELECT tag_id, COUNT(user_id) as scan_count
        FROM scans
        GROUP BY tag_id
        ORDER BY scan_count DESC
    `;
    return new Promise((res, rej) => {
        db.all(query, [], (err, data) => {
            if (err) {
                return rej(err);
            }
            res(data);
        });
    });
}

/**
 * 
 * @returns {Promise<{name: string, identifier: string, timestamp: string}>}
 */
function getFirstComplete() {
    const query = `
        SELECT u.name, u.identifier, MAX(s.timestamp) as timestamp
        FROM users u
        JOIN scans s ON u.identifier = s.user_id
        GROUP BY u.identifier
        HAVING COUNT(s.tag_id) = (SELECT COUNT(*) FROM tags)
        ORDER BY timestamp ASC
    `;

    return new Promise((res, rej) => {
        db.all(query, [], (err, data) => {
            if (err) {
                return rej(err);
            }
            res(data);
        });
    });
}

/**
 * 
 * @param {string} tag_id 
 * @param {string} label 
 * @returns {Promise<void>}
 */
function addTag(tag_id, label = null) {
    return new Promise((res, rej) => {
        db.run(`INSERT OR IGNORE INTO tags (tag_id, label) VALUES (?, ?)`, [tag_id, label], (err, data) => {
            if (err) {
                return rej(err);
            }
            res(data);
        });
    });
}

/**
 * 
 * @returns {Promise<{tag_id: string, label: string}[]>}
 */
function getAllTags() {
    return new Promise((res, rej) => {
        db.all(`SELECT tag_id, label FROM tags ORDER BY tag_id`, [], (err, data) => {
            if (err) {
                return rej(err);
            }
            res(data);
        });
    });
}


/**
 * 
 * @returns {Promise<number>}
 */
function getTagsCount() {
    return new Promise((res, rej) => {
        db.get(`SELECT count(tag_id) as count FROM tags`, [], (err, data) => {
            if (err) {
                return rej(err);
            }
            res(data.count);
        });
    });
}

/**
 * 
 * @param {string} tag_id 
 * @returns {Promise<{tag_id: string}>}
 */
function tagExists(tag_id) {
    return new Promise((res, rej) => {
        db.get(`SELECT tag_id FROM tags WHERE tag_id = ?`, [tag_id], (err, data) => {
            if (err) {
                return rej(err);
            }
            res(data);
        });
    });
}



module.exports = {
    db,
    registerUser,
    findUserByIdentifier,
    findUsernameByIdentifier,
    logScan,
    getUserScans,
    getScansByClue,
    getFirstComplete,
    getUserByCode,
    setUserCompletionCode,
    getUserScanCount,
    addTag,
    getAllTags,
    tagExists,
    getTagsCount,
}
