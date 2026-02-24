import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const login = async (username, password) => {
        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                username,
                password
            });

            const userData = {
                username: response.data.username,
                roles: response.data.roles,
                token: response.data.token
            };

            setUser(userData);
            localStorage.setItem('token', userData.token);
            localStorage.setItem('user', JSON.stringify(userData));
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please check your credentials.'
            };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const hasRole = (role) => {
        return user?.roles?.includes(role) || false;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
