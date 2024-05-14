import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

let db;

// Function to open the SQLite database
async function openDatabase() {
    if (!db) {
        db = await open({
            filename: '/tmp/database.db',
            driver: sqlite3.Database
        });

        // Create the accounts table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                balance INTEGER DEFAULT 0
            )
        `);
    }

    return db;
}

// Function to create an account
export async function createAccount(username, password, balance = 0) {
    try {
        // Open the database
        const db = await openDatabase();

        // Insert the account into the database
        const result = await db.run(`
            INSERT INTO accounts (username, password, balance)
            VALUES (?, ?, ?);
        `, [username, password, balance]);

        // Get the ID of the inserted account
        const accountId = result.lastID;

        // Return the ID of the inserted account
        return accountId;
    } catch (error) {
        console.error(`Error occurred while creating account: ${error.message}`);
        throw error; // Rethrow the error to handle it in the calling function or middleware
    }
}
