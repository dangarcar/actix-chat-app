import React, { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getServerUrl } from "../App";

export interface User {
    username: string,
    password: string
}

interface AuthUser {
    user: User | null,
    login: (username: string, password: string) => Promise<void>,
    logout: () => Promise<void>,
    signup: (user: User) => Promise<void>,
    getServerUser: () => Promise<void>,
}

const AuthContext = createContext<AuthUser>({
    user: null,
    login: async (_username, _password) => {},
    logout: async () => {},
    signup: async (_user) => {},
    getServerUser: async() => {},
});

export function useAuth() {
    return useContext(AuthContext);
}

export default function AuthProvider(props: {children: JSX.Element}) {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    const login = async (username: string, password: string) => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        const response = await fetch(getServerUrl("/login"), {
            method: "POST",
            body: JSON.stringify({ username, password }),
            headers,
        });

        if(!response.ok)
            throw Error(await response.text());

        setUser({ username, password });
        navigate("/");
    }

    const logout = async () => {
        const response = await fetch(getServerUrl("/logout"), {
            method: "DELETE"
        });

        if(!response.ok)
            throw Error(await response.text());

        setUser(null);
        navigate("/login");
    }

    const signup = async (user: User) => {
        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        const response = await fetch(getServerUrl("/create"), {
            method: "POST",
            body: JSON.stringify({
                username: user.username,
                password: user.password
            }),
            headers,
        });

        if(!response.ok)
            throw Error(await response.text());

        setUser({ 
            username: user.username, 
            password: user.password
        });

        navigate("/");
    }

    const getServerUser = async () => {
        const response = await fetch(getServerUrl('/user'));
                
        if(!response.ok) 
            throw Error(await response.text());

        const json = await response.json();
        setUser({
            username: json.username,
            password: ""
        });
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, signup, getServerUser }}>
            {props.children}
        </AuthContext.Provider>
    );
}