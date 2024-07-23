import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Popup from "reactjs-popup";
import UserImage from "../../components/UserImage";
import Scrollbars from "react-custom-scrollbars-2";
import { Search } from "lucide-react";

interface CreateGroupData {
    groupName: string,
    members: string[]
}

function Member(name: string) {
    return <div key={name} >
        <UserImage size={"md"} name={name} />
        <p>{name}</p>
    </div>
}

export default function CreateGroup({open, setOpen}) {
    const { register, handleSubmit, formState: {errors}, setError, setValue } = useForm();
    const [formData, setFormData] = useState<CreateGroupData>({
        groupName: '',
        members: ['pepe', 'jose', 'paco']
    });
    const [searchInput, setSearchInput] = useState('')
    const [bestUsers, setBestUsers] = useState<string[]>([])

    const onSubmit = async () => {
        console.log(formData);
    }

    const handleSearchInput: React.ChangeEventHandler<HTMLInputElement> = e => {
        e.preventDefault()
        setSearchInput(e.target.value);
        console.log(searchInput);
        bestUsers.push(searchInput);
        setBestUsers(bestUsers);
    }

    return (
        <Popup 
            open={open}
            closeOnDocumentClick
            onClose={ e => setOpen(false) }
            className="w-screen h-screen backdrop-blur-sm backdrop-brightness-50 flex justify-center items-center"
        >
            <div className="bg-slate-700 border-slate-100 border-2 rounded-md shadow-glow-2 w-96" >
                <form onSubmit={handleSubmit(onSubmit)} className="p-2 flex flex-col" >
                    <p className="font-bold text-3xl text-slate-50 text-center mb-4" >Create new group</p>

                    <label className="block text-gray-300 font-semibold mb-1 ml-1" >Group name:</label>
                    <input type="text" placeholder="Enter group name:" className="appearance-none w-full bg-slate-900 rounded text-gray-200 px-2 py-1 hover:shadow-glow-2"
                    {...register("groupName", {
                        value: formData.groupName,
                        onChange: e => setFormData({...formData, [e.target.name]: e.target.value})
                    })} />

                    <label className="block text-gray-300 font-semibold mb-1 ml-1" >Group members:</label>
                    <Scrollbars className="overflow-x-auto overflow-y-hidden"
                    renderThumbHorizontal={ ({...props}) => <div {...props} className="bg-slate-500 rounded-full"/> }>
                        <div className="flex gap-2 h-16">{
                            formData.members.map(name => Member(name))
                        }</div>
                    </Scrollbars>

                    <div className="flex rounded p-2 m-2 bg-slate-900 gap-2 border-2 border-transparent focus-within:border-slate-200">
                        <Search size={24} />
                        <input 
                            type="text"
                            placeholder="Search contact..."
                            value={searchInput}
                            onChange={handleSearchInput}
                            className="bg-transparent focus:outline-none grow"
                        />
                    </div>
                    
                    <ul>{
                        bestUsers.map(e => <li key={e}>{e}</li>)
                    }</ul>

                    <button type="submit" className="bg-green-700 rounded p-1.5 font-semibold self-center" >
                        Create group
                    </button>
                </form>
            </div>
        </Popup>
    )
}