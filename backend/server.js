import express from 'express';
import bcrypt from 'bcrypt';
import { createAccount, getAccounts } from './database.js';
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
        const hashedPwd = await bcrypt.hash(req.body.password, 10);
        const user = {
            username: req.body.username,
            password: hashedPwd,
        }
        const newUser = await createAccount(user.username, user.password)
        console.log("created new user", newUser)
        res.status(200).json(newUser);
    } catch (err) {
        console.log("create user failed", err)
        res.status(500).json(err);
    }
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).json({ message: err.message });
})

app.listen(3000, () => {
    console.log("Server running on port 3000");
})
