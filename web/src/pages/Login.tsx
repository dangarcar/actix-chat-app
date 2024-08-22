import React, { useState } from "react"
import { Link } from "react-router-dom";
import userImage from './../assets/user.png';
import { useAuth } from "../components/AuthProvider";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>();

    const { login } = useAuth();

    async function handleSubmit(e: React.ChangeEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            setErrorMessage(null);
            await login(username, password);
        } catch(error) {
            if(error instanceof Error)
                setErrorMessage(error.message);
            else
                setErrorMessage('An unknown error ocurred');
        }
    }

    return (
        <div className="flex justify-center p-10 bg-slate-950 h-screen">
            <form onSubmit={handleSubmit} className="flex flex-col bg-slate-800 min-w-80 rounded shadow-glow-3 p-4 h-fit">
                <p className="text-center text-3xl text-white font-bold mb-4">Log in</p>

                <img src={userImage} width={128} height={128} className="self-center mb-1"/>

                <div className="mb-4">
                    <label className="block mb-1 text-gray-300 ml-1 font-semibold">
                        Username:
                    </label>
                    <input 
                        name="username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        placeholder="Enter your username:" 
                        className="w-full bg-slate-900 rounded text-gray-200 px-2 py-1 hover:shadow-glow-2"
                        required
                    />
                    {errorMessage && <p className="mt-auto text-red-500 text-sm ml-1">{errorMessage}</p>}
                </div>

                <div className="mb-2">
                    <label className="block mb-1 text-gray-300 ml-1 font-semibold">
                        Password:
                    </label>
                    <input 
                        name="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Enter your password:" 
                        type="password"
                        className="appearance-none w-full bg-slate-900 rounded text-gray-200 px-2 py-1 hover:shadow-glow-2"
                        required
                    />
                </div>
                
                <p className="text-gray-400 text-sm ml-1 mb-10">
                    Don't have an account? 
                    <Link to="/signup" className="text-gray-200"> Sign up</Link>
                </p>

                <button type="submit" className="bg-gradient-to-r from-emerald-900 to-emerald-600 rounded text-gray-300 p-1.5 font-bold shadow-glow-1">
                    Log in
                </button>

            </form>
        </div>
    );
}