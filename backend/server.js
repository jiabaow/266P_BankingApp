import express from 'express';
import bcrypt from 'bcrypt';
import { createAccount, getAccounts, getAccount, getTransactions, updateBalance, createTransaction } from './database.js';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());

// Password validation function
const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigits = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasDigits && hasSpecialChar;
};

app.get('/', (req, res) => {
    res.send('Send homepage');
});

// gets all the accounts
app.get('/accounts', async (req, res) => {
    try {
        const accounts = await getAccounts();
        if (accounts == null) {
            return res.status(404).json({ message: 'No accounts found' });
        }
        res.status(200).json(accounts);
    } catch (err) {
        console.error("Error fetching accounts:", err);  // Error handling added
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/account', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Validate password strength
        if (!validatePassword(password)) {
            return res.status(400).json({ message: 'Password does not meet the required criteria: \n' + '1. Minimum Length: At least 8 characters.\n' +
                    '2. Uppercase Letters: At least one uppercase letter.\n' +
                    '3. Lowercase Letters: At least one lowercase letter.\n' +
                    '4. Digits: At least one digit.\n' +
                    '5. Special Characters: At least one special character (e.g., !@#$%^&*(),.?":{}|<>).)' });
        }

        const account = await getAccount(username);
        if (account == null) {
            const hashedPwd = await bcrypt.hash(password, 10);
            const newUser = await createAccount(username, hashedPwd);
            res.status(200).json({ userId: newUser });
        } else {
            res.status(401).json({ message: 'Username already exists!' });
        }
    } catch (err) {
        console.error("Error creating account:", err);  // Error handling added
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/account/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        const user = await getAccount(username);
        if (!user) {
            return res.status(401).json({ message: 'Invalid password or username' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
            res.status(200).json({ message: 'Login successful', expires_in: 300 });
        } else {
            res.status(401).json({ message: 'Invalid password or username' });
        }
    } catch (err) {
        console.error("Error logging in:", err);  // Error handling added
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/account/transactions', async (req, res) => {
    try {
        const username = req.body.user;
        const account = await getAccount(username);
        if (!account) return res.status(400).json({ message: 'Account does not exist' });

        const transactions = await getTransactions(account.id);
        if (!transactions) return res.status(400).json({ message: 'No available transactions' });

        res.status(200).json(transactions);
    } catch (err) {
        console.error("Error fetching transactions:", err);  // Error handling added
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/account/balance', async (req, res) => {
    try {
        const username = req.body.user;
        const account = await getAccount(username);
        if (!account) return res.status(400).json({ message: 'Account does not exist' });

        const currBalance = account.balance;
        res.status(200).json({ message: `Your balance is ${currBalance}`, balance: currBalance });
    } catch (err) {
        console.error("Error fetching balance:", err);  // Error handling added
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/account/deposit', async (req, res) => {
    try {
        const { user, amount } = req.body;

        const validNumberFormat = /^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$/;
        const numberInput = amount;

        if (!validNumberFormat.test(numberInput)) {
            return res.status(400).json({ message: 'Invalid number format' });
        }

        const account = await getAccount(user);
        if (!account) return res.status(400).json({ message: 'Account does not exist' });

        const newBalance = account.balance + Number(amount);
        await updateBalance(user, newBalance);
        await createTransaction(account.id, Number(amount));

        res.status(201).json({ message: 'Deposit successful' });
    } catch (err) {
        console.error("Error processing deposit:", err);  // Error handling added
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/account/withdraw', async (req, res) => {
    try {
        const { user, amount } = req.body;

        const validNumberFormat = /^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$/;
        const numberInput = amount;

        if (!validNumberFormat.test(numberInput)) {
            return res.status(400).json({ message: 'Invalid number format' });
        }

        const account = await getAccount(user);
        if (!account) return res.status(400).json({ message: 'Account does not exist' });

        const newBalance = account.balance - Number(amount);
        if (newBalance < 0) {
            return res.status(400).json({ message: 'Insufficient funds' });
        }

        await updateBalance(user, newBalance);
        await createTransaction(account.id, -Number(amount));

        res.status(201).json({ message: 'Withdraw successful' });
    } catch (err) {
        console.error("Error processing withdrawal:", err);  // Error handling added
        res.status(500).json({ message: 'Server error' });
    }
});

// Error handling middleware for unexpected errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server error' });
});

app.listen(3003, () => {
    console.log("Server running on port 3003");
});
