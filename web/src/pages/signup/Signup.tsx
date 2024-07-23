import React, { useState } from "react"
import { Link } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import userImage from './../../assets/user.png';
import { useForm } from "react-hook-form";

interface SignUpData {
    username: string,
    password: string,
    repeatPassword: string
}

export default function SignUp() {
    const { register, handleSubmit, formState: {errors}, setError, setValue } = useForm();
    const [formData, setFormData] = useState<SignUpData>({
        username: '',
        password: '',
        repeatPassword: ''
    });

    const { signup } = useAuth();

    const onSubmit = async (data: any) => {
        try {
            await signup({
                username: formData.username,
                password: formData.password
            });
        } catch(err) {
            setError("username", { 
                message: err instanceof Error? err.message : "Something unexpected happened"
            }, { shouldFocus: true });

            setValue("username", '');
        }
    }

    return (
        <div className="flex justify-center p-10 bg-slate-950 h-screen">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col bg-slate-800 min-w-80 rounded shadow-glow-3 p-4 h-fit">
                <p className="text-center text-3xl text-white font-bold mb-4">Create new account</p>

                <img src={userImage} width={128} height={128} className="self-center mb-1"/>

                <div className="mb-4">
                    <label className="block mb-1 text-gray-300 ml-1 font-semibold">
                        Username:
                    </label>
                    <input placeholder="Enter your username:" className="w-full bg-slate-900 rounded text-gray-200 px-2 py-1 hover:shadow-glow-2"
                    {...register("username", {
                        value: formData.username,
                        minLength: 4,
                        maxLength: 32,
                        required: true,
                        onChange: e => setFormData({...formData, [e.target.name]: e.target.value})
                    })}/>
                    {errors.username && <p className="text-red-500 text-sm ml-1">{errors.username?.message?.toString()}</p>}
                </div>

                <div className="mb-2">
                    <label className="block mb-1 text-gray-300 ml-1 font-semibold">
                        Password:
                    </label>
                    <input placeholder="Enter your password:" type="password" className="appearance-none w-full bg-slate-900 rounded text-gray-200 px-2 py-1 hover:shadow-glow-2"
                        {...register("password", {
                            value: formData.password,
                            minLength: 8,
                            required: true,
                            onChange: e => setFormData({...formData, [e.target.name]: e.target.value})
                        })}
                    />
                    {errors.password && <p className="text-red-500 text-sm ml-1">{
                        errors.password?.message? errors.password?.message?.toString() : errors.password?.type?.toString()
                    }</p>}
                </div>
                
                <div className="mb-2">
                    <label className="block mb-1 text-gray-300 ml-1 font-semibold">
                        Repeat password:
                    </label>
                    <input placeholder="Repeat your password:" type="password" className="appearance-none w-full bg-slate-900 rounded text-gray-200 px-2 py-1 hover:shadow-glow-2"
                        {...register("repeatPassword", {
                            value: formData.password,
                            validate: (value, _formValue) => {
                                if(value !== formData.password)
                                    return "This is not like the password above"
                            },
                            onChange: e => setFormData({...formData, [e.target.name]: e.target.value})
                        })}
                    />
                    {errors.repeatPassword && <p className="text-red-500 text-sm ml-1">{
                        errors.repeatPassword?.message? errors.repeatPassword?.message?.toString() : errors.repeatPassword?.type?.toString()
                    }</p>}
                </div>
                
                <p className="text-gray-400 text-sm ml-1 mb-10">
                    Already have an account? 
                    <Link to="/login" className="text-gray-200"> Sign in</Link>
                </p>

                <button type="submit" className="mt-auto bg-gradient-to-r from-emerald-900 to-emerald-600 rounded text-gray-300 p-1.5 font-bold shadow-glow-1">
                    Sign in
                </button>

            </form>
        </div>
    );
}