import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './login/Login';
import ChatApp from './chat/ChatApp';
import Signup from './signup/Signup';
import AuthProvider from '../components/AuthProvider';

export function getServerUrl(route: string) {
    const serverUrl = window.location.href.slice(0, window.location.href.lastIndexOf('/'));
    return serverUrl + route;
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<ChatApp/>} />
                    <Route path="/login" element={<Login/>} />
                    <Route path="/signup" element={<Signup/>} />
                
                    <Route path='*' element={<Navigate to='/' />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}