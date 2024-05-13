import React, { useState } from "react";
import Axios from 'axios';
import logo from './logo.png';
import { useNavigate } from "react-router-dom";

export const Register = (props) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [amount, setAmount] = useState(0);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(localStorage.getItem(localStorage.getItem("authenticated")|| false));
    const navigate = useNavigate();

    const validateInput = (string) => {
        return /^[\w\-.]{1,127}$/.test(string);
    }

    const validateAmountInput = (amount) => {
        return /^(?!0\d)\d*(\.\d+)?$/.test(amount) && /^\d+(\.\d{2})?$/.test(amount);
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        if(!(validateInput(username) && validateInput(password) && validateAmountInput(amount))){
            alert("The username or password entered is invalid. Please make sure they contain lowercase letters, digits, or one of these special characters['_', '-', '.'] as well as between 1 and 127 characters.");
            return;
        }

        if(password == confirmPassword){
            Axios.post("http://localhost:8080/account", {
                "username": username,
                "password": password,
                "balance": amount
            }).then((res) => {
                console.log(res);
                setAuthenticated(true)
                localStorage.setItem("authenticated", true);
                navigate("/dashboard", {"state": {"username": username, "token": res.data.access_token}});
            }).catch((error) => {
                alert(error.response.data.message);
            })
        } else {
            alert("Something went wrong with the username or password");
        }
    }

    return (
        <div className="auth-form-container">
            <img src={logo} className="logo" />
            <form className="register-form" onSubmit={handleSubmit} /*method="post"*/>
                <label htmlFor="username">Username</label>
                <input
                    value = {username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="username"
                    className="login__input login__input--user"
                    name="username"
                    id="username"
                />          
                <label htmlFor="password">Password</label>
                <input
                    value = {password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="********"
                    maxlength="127"
                    className="login__input login__input--password"
                    name="password"
                    id="password"
                />
                <label htmlFor="password">Confirm Password</label>
                <input
                    value = {confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    type="password"
                    placeholder="********"
                    maxlength="127"
                    className="login__input login__input--password"
                    name="password"
                    is="password"
                />
                <label htmlFor="amount">Initial Amount</label>
                <input
                    value = {amount}
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