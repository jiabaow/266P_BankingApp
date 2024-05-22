import express from 'express';
import bcrypt from 'bcrypt';
import { createAccount, getAccounts, getAccount, getTransactions, updateBalance, createTransaction, getTransaction } from './database.js';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send('Send homepage');
});

// gets all the accounts
app.get('/accounts', async (req, res) => {
    const accounts = await getAccounts();
    if (accounts == null) {
        res.status(404).json({ message: 'No accounts found' });
    }
    res.status(200).json(accounts);
});

app.post('/account', async (req, res) => {
    try {
        console.log("server /account", req.body);
        const account = await getAccount(req.body.username);
        if (account == null) {
            const hashedPwd = await bcrypt.hash(req.body.password, 10);
            const user = {
                username: req.body.username,
                password: hashedPwd,
            }
            const newUser = await createAccount(user.username, user.password)
            console.log("created new user", newUser)
            res.status(200).json(newUser);
        }
        else {
            res.status(401).json({ message: 'Username already exits!' });
        }
    } catch (err) {
        console.log("create user failed", err)
        res.status(500).json(err);
    }
});

app.post('/account/login', async (req, res) => {
    const user = await getAccount(req.body.username);

    if(user == null){
        res.status(401).json({ message: 'Invalid password or username' });
    }

    try {
        if(await bcrypt.compare(req.body.password, user.password)){
            // const payload = { username };
            // const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '5min' });
            //res.status(200).json({ message : 'Login successful', access_token: token, expires_in: 300 });
            res.status(200).json({ message : 'Login successful', expires_in: 300 });
        } else {
            res.status(401).json({ message: 'Invalid password or username' });
        }
    } catch (error) {
        res.status(500).send();
    }
});

app.post('/account/transactions', async(req, res) => {
    const username = req.body.user;
    const account = await getAccount(username);
    if (account == null) res.status(400).json({ message: 'Account does not exist' });
    const account_id = account.id;
    const transactions = await getTransactions(account_id);
    if (transactions == null) res.status(400).json({ message: 'No available transaction' });
    res.status(200).json(transactions);
});

app.get('/account/transaction', async (req, res) => {
    try {
        const username = req.body.user;
        const account = await getAccount(username);
        if (account == null) res.status(400).json({ message: 'Account does not exist' });
        const account_id = account.id;
        const created_at = req.body.createdAt;

        const transactions = await getTransaction(account_id, created_at);

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error during fetching transaction:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/account/balance', async(req, res) => {
    const username = req.body.user;
    const account = await getAccount(username);
    if (account == null) res.status(400).json({ message: 'Account does not exist' });
    console.log(account);
    const currBalance = account.balance;
    res.status(201).json({message: `Your balance is ${currBalance}`, balance: currBalance})
});

app.post('/account/deposit', async(req, res) => {
    console.log("deposit req:", req)

    const validNumberFormat = /^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$/;
    const numberInput = req.body.amount;

    if (!validNumberFormat.test(numberInput)) {
        return res.status(400).json({ message: 'Invalid number format' });
    }

    const username = req.body.user;
    const amount = Number(numberInput);
    const account = await getAccount(username);
    if (account == null) res.status(400).json({ message: 'Account does not exist' });
    console.log("account: ", account)

    const account_id = account.id;
    const oldBalance = Number(account.balance);
    const newBalance = oldBalance + amount;

    await updateBalance(username, newBalance);

    await createTransaction(account_id, amount);
    res.status(201).json({ message: 'Deposit successful' });
});

app.post('/account/withdraw', async(req, res) => {
    const validNumberFormat = /^(0|[1-9][0-9]*)(\.[0-9]{1,2})?$/;
    const numberInput = req.body.amount;

    if (!validNumberFormat.test(numberInput)) {
        return res.status(400).json({ message: 'Invalid number format' });
    }

    const username = req.body.user;
    const amount = Number(numberInput);
    const account = await getAccount(username);
    if (account == null) res.status(400).json({ message: 'Account does not exist' });

    const account_id = account.id;
    const oldBalance = Number(account.balance);
    const newBalance = oldBalance - amount;

    if (newBalance < 0) {
        res.status(400).json({ message: 'Insufficient funds' });
    } else {
        await updateBalance(username, newBalance);

        await createTransaction(account_id, -amount);
        res.status(201).json({ message: 'Withdraw successful' });
    }
});

app.use((err, req, res) => {
    console.log(err.stack);
    res.status(500).json({ message: err.message });
})

app.listen(3003, () => {
    console.log("Server running on port 3003");
})
