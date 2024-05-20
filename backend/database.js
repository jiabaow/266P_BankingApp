import {open} from 'sqlite';
import sqlite3 from 'sqlite3';

let db;

// Function to open the SQLite database
async function openDatabase() {
    if (!db) {
        db = await open({
            filename: 'database.db',
            driver: sqlite3.Database
        });

        // Create the accounts table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username VARCHAR(127) NOT NULL,
                password VARCHAR(127) NOT NULL,
                balance INTEGER DEFAULT 0
            )
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                account_id INTEGER NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (account_id) REFERENCES accounts(id)
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

        return result.lastID;
    } catch (error) {
        console.error(`Error occurred while creating account: ${error.message}`);
        throw error; // Rethrow the error to handle it in the calling function or middleware
    }
}

export async function getAccounts(username) {
    try {
        // Open the database
        const db = await openDatabase();

        // Query the database to get the account
        return await db.get(`
            SELECT *
            FROM accounts
            WHERE username = ?
        `, [username]);
    } catch (error) {
        console.error(`Error occurred while retrieving account: ${error.message}`);
        throw error;
    }
}

export async function getAccount(username) {
    try {
        // Open the database
        const db = await openDatabase();

        // Execute the SELECT query
        const query = `
            SELECT *
            FROM accounts
            WHERE username = ?
        `;
        const [row] = await db.all(query, [username]);

        // Return the first row (or null if no account found)
        return row || null;
    } catch (error) {
        console.error(`Error occurred while getting account: ${error.message}`);
        throw error;
    }
}

export async function getTransactions(account_id) {
    try {
        // Open the database
        const db = await openDatabase();

        // Execute the SELECT query
        const query = `
            SELECT *
            FROM transactions
            WHERE account_id = ?
        `;
        return await db.all(query, [account_id]);
    } catch (error) {
        console.error(`Error occurred while fetching transactions: ${error.message}`);
        throw error;
    }
}

export async function createTransaction(accountId, amount) {
    try {
        const db = await openDatabase();

        // Insert a new transaction into the transactions table
        await db.run(`
            INSERT INTO transactions (account_id, amount)
            VALUES (?, ?);
        `, [accountId, amount]);

        // Return success
        return true;
    } catch (error) {
        console.error(`Error occurred while creating transaction: ${error.message}`);
        throw error; // rethrow the error to handle it in the calling function or middleware
    }
}

export async function updateBalance(username, amount) {
    try {
        const db = await openDatabase();

        // Update the balance in the accounts table
        await db.run(`
            UPDATE accounts
            SET balance = ?
            WHERE username = ?
        `, [amount, username]);

        // Return success
        return true;
    } catch (error) {
        console.error(`Error occurred while updating balance: ${error.message}`);
        throw error; // rethrow the error to handle it in the calling function or middleware
    }
}
