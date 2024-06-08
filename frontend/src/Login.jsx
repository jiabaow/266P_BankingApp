import React, { useState } from "react";
import Axios from 'axios';
import logo from './anteater.png';
import { useNavigate } from "react-router-dom";

export const Login = (props) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [authenticated, setAuthenticated] = useState(localStorage.getItem(localStorage.getItem("authenticated")|| false));
    const navigate = useNavigate();

    const validateInput = (string) => {
        return /^[\w\-.]{1,127}$/.test(string);
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        if(!(validateInput(username) && validateInput(password))){
            alert("The username or password entered is invalid. Please make sure they contain lowercase letters, digits, or one of these special characters['_', '-', '.'] as well as between 1 and 127 characters.");
            return;
        }

        Axios.post("http://localhost:3003/account/login", {
            "username": username,
            "password": password
        }).then((res) => {
            const token = res.data.token;
            setAuthenticated(true)
            localStorage.setItem("authenticated", true);
            localStorage.setItem("token", token); 
            navigate("/dashboard", {"state": {"username": username}});
        }).catch((e) => {
            if(e.response.status === 401){
                alert(e.response.data.message);
                console.log(e.response.data);
            }
        })
    }

    return (
        <div className="auth-form-container">
            <div className="logo-container">
                <img src={logo} className="logo" alt="Logo" />
                <h2 className="bank-title" style={{ color: 'var(--primary-color)' }}>Anteater Bank</h2>
            </div>
            {/* <img src={logo}className="logo" /> */}
            <form className="login-form" onSubmit={handleSubmit}>
                <label htmlFor="username">Username</label>
                <input
                    value = {username}
                    onChange={(e) => setUsername(e.target.value)}
                    type="text"
                    placeholder="username"
                    minLength="1"
                    maxLength="127"
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
                    minLength="1"
                    maxLength="127"
                    className="login__input login__input--password"
                    name="password"
                    is="password"
                />
                <button type="submit" className="login__btn">Login &rarr;</button>
            </form>
            <button className="link-btn" onClick={() => props.onFormSwitch('register')}>Don't have an account? Register here.</button>
        </div>
    )
}
