import express from 'express';
import bcrypt from 'bcrypt';
import { createAccount } from './database.js';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Send homepage');
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
        res.status(200).json(newUser);
    } catch (err) {
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
