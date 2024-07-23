import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Popup from "reactjs-popup";
import { getServerUrl } from "../App";

export default function AddContact({open, setOpen}) {
    const { register, handleSubmit, setValue } = useForm();
    const [contact, setContact] = useState('');
    const [error, setError] = useState<string>();

    const onSubmit = async (data: any) => {
        try {
            const response = await fetch(getServerUrl(`/add-contact/${contact}`), {
                method: 'POST'
            });
    
            if(!response.ok)
                throw Error(await response.text());
            
            setOpen(false);
        } catch(err) {
            if(err instanceof Error)
                setError(err.message)
        }

        setValue('contact', '');
    }
    
    useEffect(() => {

    });
    
    return <Popup 
        open={open}
        closeOnDocumentClick
        onClose={ e => setOpen(false) }
        className="w-screen h-screen backdrop-blur-sm backdrop-brightness-50 flex justify-center items-center"
    >
        <div className="bg-slate-700 border-slate-100 border-2 rounded-md shadow-glow-2 w-96" >
            <form className="p-2 flex flex-col" >
                <p className="font-bold text-3xl text-slate-50 text-center mb-4" >Add new contact</p>

                <div className="mb-2">
                    <label className="block text-gray-300 font-semibold mb-1 ml-1" >Contact name:</label>
                    <input type="text" placeholder="Enter contact name:" className="appearance-none w-full bg-slate-900 rounded text-gray-200 px-2 py-1 hover:shadow-glow-2"
                    {...register("contact", {
                        value: contact,
                        onChange: e => { setError(undefined); setContact(e.target.value) }
                    })} />
                    {error && <p className="text-red-500 text-sm ml-1" >{error}</p>}
                </div>

                <button className="bg-green-700 rounded p-1.5 font-semibold self-center" onClick={handleSubmit(onSubmit)} >
                    Add contact
                </button>
            </form>
        </div>
    </Popup>
}