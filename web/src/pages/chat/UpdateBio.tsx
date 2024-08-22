import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Popup from "reactjs-popup";
import { getServerUrl } from "../../App";

export default function UpdateBio({open, setOpen}) {
    const { handleSubmit, setValue } = useForm();
    const [bio, setBio] = useState('');
    const [error, setError] = useState<string>();

    const onSubmit = async (data: any) => {
        try {
            const headers = new Headers();
            headers.set('Content-Type', 'application/json');
            const response = await fetch(getServerUrl(`/bio`), {
                method: 'POST',
                body: JSON.stringify({ bio }),
                headers
            });
    
            if(!response.ok)
                throw Error(await response.text());
            
            setOpen(false);
        } catch(err) {
            if(err instanceof Error)
                setError(err.message)
        }

        setValue('bio', '');
    }
    
    return <Popup 
        open={open}
        closeOnDocumentClick
        onClose={ e => setOpen(false) }
        className="w-screen h-screen backdrop-blur-sm backdrop-brightness-50 flex justify-center items-center"
    >
        <div className="bg-slate-700 border-slate-100 border-2 rounded-md shadow-glow-2 w-96" >
            <form className="p-2 flex flex-col" >
                <p className="font-bold text-3xl text-slate-50 text-center mb-4" >Change biography</p>

                <div className="mb-2">
                    <label className="block text-gray-300 font-semibold mb-1 ml-1" >New bio:</label>
                    <textarea 
                        rows={5} 
                        placeholder="Enter new bio:" 
                        onChange={e => { setError(undefined); setBio(e.target.value); }}
                        className="appearance-none w-full bg-slate-900 rounded text-gray-200 px-2 py-1 hover:shadow-glow-2"
                    />
                    {error && <p className="text-red-500 text-sm ml-1" >{error}</p>}
                </div>

                <button className="bg-green-700 rounded p-1.5 font-semibold self-center" onClick={handleSubmit(onSubmit)} >
                    Update bio
                </button>
            </form>
        </div>
    </Popup>
}