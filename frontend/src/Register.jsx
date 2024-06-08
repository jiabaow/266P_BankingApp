import React, { useState } from "react";
import Axios from 'axios';
import logo from './anteater.png';
import { useNavigate } from "react-router-dom";

export const Register = (props) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [amount, setAmount] = useState(0);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(localStorage.getItem("authenticated") || false);
    const navigate = useNavigate();

    const validateInput = (string) => {
        return /^[\w\-.]{1,127}$/.test(string);
    }

    const validateAmountInput = (amount) => {
        return /^(?!0\d)\d*(\.\d+)?$/.test(amount) && /^\d+(\.\d{2})?$/.test(amount);
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!(validateInput(username) && validateInput(password) && validateAmountInput(amount))) {
            alert("The username or password entered is invalid. Please make sure they contain lowercase letters, digits, or one of these special characters['_', '-', '.'] as well as between 1 and 127 characters.");
            return;
        }

        if (password === confirmPassword) {
            Axios.post("http://localhost:3003/account", {
                "username": username,
                "password": password,
                "balance": amount
            }).then((res) => {
                console.log("Account created", res);

                return Axios.post("http://localhost:3003/account/login", {
                    "username": username,
                    "password": password
                });
            }).then((res) => {
                const token = res.data.token;
                setAuthenticated(true);
                localStorage.setItem("authenticated", true);
                localStorage.setItem("token", token);  
                navigate("/dashboard", { state: { "username": username } });
            }).catch((error) => {
                console.error('Error response:', error);
                alert(error.response.data.message);
            });
        } else {
            alert("Passwords do not match");
        }
    }

    return (
        <div className="auth-form-container">
            <div className="logo-container">
                <img src={logo} className="logo" alt="Logo" />
                <h2 className="bank-title" style={{ color: 'var(--primary-color)' }}>Anteater Bank</h2>
            </div>
            <form className="register-form" onSubmit={handleSubmit}>
                <label htmlFor="username">Username</label>
                <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="username"
                    className="login__input login__input--user"
                    name="username"
                    id="username"
                />
                <label htmlFor="password">Password</label>
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="********"
                    maxLength="127"
                    className="login__input login__input--password"
                    name="password"
                    id="password"
                />
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    placeholder="********"
                    maxLength="127"
                    className="login__input login__input--password"
                    name="confirmPassword"
                    id="confirmPassword"
                />
                <label htmlFor="amount">Initial Amount</label>
                <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    placeholder="0"
                    className="login__input login__input--amount"
                    name="amount"
                    id="amount"
                />
                <button type="submit" className="login__btn">Register &rarr;</button>
            </form>
            <button className="link-btn" onClick={() => props.onFormSwitch('login')}>Already have an account? Login here.</button>
        </div>
    )
}