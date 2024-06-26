import React, { useState, useEffect } from "react";
import Axios from 'axios';
import logo from './anteater.png';
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const Dashboard = () => {
    const [username, setUsername] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState(null);
    const [authenticated, setAuthenticated] = useState(localStorage.getItem("authenticated"));
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(0);
    const [deposit, setDeposit] = useState(0);
    const [withdrawal, setWithdrawal] = useState(0);
    const [reloadDashboard, setReloadDashboard] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredTransactions, setFilteredTransactions] = useState([]);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!authenticated) {
            navigate("/");
            return;
        }

        if (location.state === null || location.state.username === null) {
            navigate("/");
            return;
        }

        const token = localStorage.getItem("token");
        setUsername(location.state.username);

        Axios.post('http://localhost:3003/account/transactions', {
            user: location.state.username
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            setTransactions(res.data);
            setFilteredTransactions(res.data);
        })
        .catch(error => {
            console.error(error);
            setAuthenticated(false);
        });
    }, [reloadDashboard, authenticated, location, navigate]);

    // gets users initial balance and is updated anytime a transaction is made
    useEffect(() => {
        if (!authenticated) {
            navigate("/");
            return;
        }

        if (location.state === null || location.state.username === null) {
            navigate("/");
            return;
        }

        const token = localStorage.getItem("token");

        Axios.post('http://localhost:3003/account/balance', {
            user: location.state.username
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            setBalance(res.data.balance);
        })
        .catch(error => {
            console.error(error);
            setAuthenticated(false);
        });
    }, [reloadDashboard, authenticated, location, navigate]);

    // Helper functions for UI events
    const handleLogout = (e) => {
        e.preventDefault();
        localStorage.removeItem("authenticated");
        localStorage.removeItem("token");
        setAuthenticated(false);
        navigate("/");
    };

    const getCurrentDate = function () {
        let today = new Date();
        return today.toLocaleDateString('en-US');
    };

    const formatDate = (date) => {
        let d = new Date(date);
        return d.toLocaleDateString('en-US');
    };

    const validateInput = (amount) => {
        return /^(?!0\d)\d*(\.\d+)?$/.test(amount) && /^\d+(\.\d{2})?$/.test(amount);
    };

    const validateTextInput = (string) => {
        return /^[\w\-.]{1,127}$/.test(string);
    };

    const handleConfirmPassSubmit = (e) => {
        e.preventDefault();

        if (!validateTextInput(confirmPassword)) {
            alert("The password entered is invalid. Please make sure it contains lowercase letters, digits, or one of these special characters ['_', '-', '.'] as well as between 1 and 127 characters.");
            return;
        }

        const token = localStorage.getItem("token");

        Axios.post("http://localhost:3003/account/login", {
            username: location.state.username,
            password: confirmPassword
        })
        .then((res) => {
            if (deposit !== 0) { // checks if we are depositing
                Axios.post('http://localhost:3003/account/deposit', {
                    user: location.state.username,
                    amount: deposit
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                .then(res => {
                    setReloadDashboard(!reloadDashboard);
                    setDeposit(0);
                    setShowModal(false);
                    setConfirmPassword("");
                })
                .catch(error => {
                    if (error.response.status === 400) {
                        alert(error.response.data.message);
                    }
                    console.error(error);
                });
            } else { // else we are withdrawing
                Axios.post('http://localhost:3003/account/withdraw', {
                    user: location.state.username,
                    amount: withdrawal
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                .then(res => {
                    setReloadDashboard(!reloadDashboard);
                    setWithdrawal(0);
                    setShowModal(false);
                    setConfirmPassword("");
                })
                .catch(error => {
                    if (error.response.status === 400) {
                        alert(error.response.data.message + ". Please withdraw less or deposit more money into account first.");
                    }
                    console.error(error);
                });
            }
        }).catch((e) => {
            if (e.response.status === 401) {
                alert(e.response.data.message);
                console.log(e.response.data);
            }
        });
    };

    const handleDepositSubmit = (e) => {
        e.preventDefault();

        if (!validateInput(deposit)) {
            alert("Your value " + deposit + " was invalid. Please enter a valid amount to deposit.");
            return;
        }

        setShowModal(true);
    };

    const handleWithdrawalSubmit = (e) => {
        e.preventDefault();

        if (!validateInput(withdrawal)) {
            alert("Your value " + withdrawal + " was invalid. Please enter a valid amount to withdraw.");
            return;
        }

        setShowModal(true);
    };

    const filterTransactions = (query) => {
        const lowercasedQuery = query.toLowerCase();
        const filtered = transactions.filter(transaction => {
            const date = formatDate(transaction.created_at);
            const amount = transaction.amount.toString();
            const type = transaction.amount > 0 ? 'Deposit' : 'Withdrawal';
            return date.includes(lowercasedQuery) || amount.includes(lowercasedQuery) || type.toLowerCase().includes(lowercasedQuery);
        });
        setFilteredTransactions(filtered);
    };

    const handleSearchChange = (e) => {
        console.log("handleSearchChange", e);
        setSearchQuery(e.target.value);
        filterTransactions(e.target.value);
    };

    if (!authenticated) {
        return <Navigate replace to="/" />;
    }

    return (
        <div>
            <nav>
                <p className="welcome">Welcome {username}!</p>
                <img src={logo} alt="Logo" className="logo" />
                <button className="logout__button" onClick={handleLogout}>Logout</button>
            </nav>

            <main className="app">
                {/* <!-- BALANCE --> */}
                <div className="balance">
                    <div>
                        <p className="balance__label">Current balance</p>
                        <p className="balance__date">
                            As of <span className="date">{getCurrentDate()}</span>
                        </p>
                    </div>
                    <p className="balance__value">${balance}</p>
                </div>

                {/* <!-- SEARCH --> */}
                <div className="search">
                    <input
                        type="text"
                        placeholder="Search transactions"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="search__input"
                    />
                </div>

                {/* <!-- MOVEMENTS --> */}
                <div className="movements">
                    {
                        filteredTransactions.length > 0 ? filteredTransactions.map(transaction => {
                            if (transaction.amount > 0) {
                                return (
                                    <div key={transaction.id} className="movements__row">
                                        <div className="movements__type movements__type--deposit">Deposit</div>
                                        <div className="movements__date">{formatDate(transaction.created_at)}</div>
                                        <div className="movements__value">${transaction.amount}</div>
                                    </div>
                                );
                            } else {
                                return (
                                    <div key={transaction.id} className="movements__row">
                                        <div className="movements__type movements__type--withdrawal">Withdrawal</div>
                                        <div className="movements__date">{formatDate(transaction.created_at)}</div>
                                        <div className="movements__value">${transaction.amount}</div>
                                    </div>
                                );
                            }
                        }) : <div className="movements__row"><p className="error__message">No recent transactions found</p></div>
                    }
                </div>

                {/* <!-- OPERATION: DEPOSIT --> */}
                <div className="operation operation--deposit">
                    <h2>Deposit Money</h2>
                    <form className="form form--deposit" onSubmit={handleDepositSubmit}>
                        <input type="number" className="form__input form__input--amount" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                        <button type="submit" className="form__btn form__btn--deposit">&rarr;</button>
                        <label className="form__label">Amount</label>
                    </form>
                </div>

                {/* <!-- OPERATION: WITHDRAW --> */}
                <div className="operation operation--withdraw">
                    <h2>Withdraw Money</h2>
                    <form className="form form--withdraw" onSubmit={handleWithdrawalSubmit}>
                        <input type="number" className="form__input form__input--amount" value={withdrawal} onChange={(e) => setWithdrawal(e.target.value)} />
                        <button className="form__btn form__btn--withdraw">&rarr;</button>
                        <label className="form__label">Amount</label>
                    </form>
                </div>

                {/* <!-- CONFIRM PASSWORD: MODAL --> */}
                {showModal && <div className="overlay"><div className="modalContainer operation operation--confirm">
                    <h2>Confirm Password</h2>
                    <p className='closeBtn' onClick={() => {
                        setShowModal(false);
                        setDeposit(0);
                        setWithdrawal(0);
                        setConfirmPassword("");
                    }}>X</p>
                    <form className="form form--deposit" onSubmit={handleConfirmPassSubmit}>
                        <input type="password" className="form__input form__input--amount" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        <button type="submit" className="form__btn form__btn--deposit">&rarr;</button>
                        <label className="form__label">Password</label>
                    </form>
                </div></div> }

            </main>
        </div>
    );
}

export default Dashboard;