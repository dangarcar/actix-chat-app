import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import Popup from "reactjs-popup";
import UserImage from "../../components/UserImage";
import Scrollbars from "react-custom-scrollbars-2";
import { Search } from "lucide-react";
import { getServerUrl } from "../App";
import { useAuth } from "../../components/AuthProvider";

//TODO: unused

interface CreateGroupData {
    groupName: string,
    members: string[]
}

function SearchContact(name: string, formData, setFormData, setBestUsers, setKeyword, forceUpdate, setForceUpdate) {
    const onClick = e => {        
        e.preventDefault();
        let newData = formData;
        newData.members.push(name);
        setFormData(newData);

        setBestUsers([]);
        setKeyword('');

        setForceUpdate(!forceUpdate);
    }
    
    return <li key={name} className="font-semibold flex gap-2 m-1 p-1 cursor-pointer rounded hover:bg-slate-800" onClick={onClick}>
        <UserImage size={"sm"} name={name}/>
        <p className="mt-1">{name}</p>
    </li>
}

function Member(name: string) {
    return <div key={name} className="flex flex-col items-center">
        <UserImage size={"sm"} name={name} />
        <p className="text-center text-sm font-semibold">{name}</p>
    </div>
}

export default function CreateGroup({open, setOpen}) {
    const {user} = useAuth();
    const { register, handleSubmit, formState: {errors}, setError, setValue } = useForm();
    const [formData, setFormData] = useState<CreateGroupData>({
        groupName: '',
        members: [user?.username!]
    });
    const [searchInput, setSearchInput] = useState('')
    const [bestUsers, setBestUsers] = useState<string[]>([])
    const [forceUpdate, setForceUpdate] = useState(true);

    const onSubmit = async e => {
        console.log(formData);

        const headers = new Headers();
        headers.append("Content-Type", "application/json");
        const response = await fetch(getServerUrl("/create-group"), {
            method: "POST",
            body: JSON.stringify({name: formData.groupName, people: formData.members}),
            headers,
        });

        if(!response.ok)
            throw Error("Group not created");

        alert("Group created!");
        setOpen(false);
    }

    const searchContact = async (keyword: string) => {
        const response = await fetch(encodeURI(`${getServerUrl("/contacts")}?search=${keyword}`));

        if(!response.ok)
            throw Error("Couldn't find contact with that keyword");

        const json = await response.json();
        return json;
    }

    const handleSearchInput: React.ChangeEventHandler<HTMLInputElement> = async e => {
        e.preventDefault()
        const searchKeyword = e.target.value;
        setSearchInput(searchKeyword);

        if(searchKeyword.trim().length <= 0) 
            return;

        let possible = await searchContact(searchKeyword);
        possible = possible.filter(e => !formData.members.includes(e));
        setBestUsers(possible);
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
                    {errors.groupName && <p>{errors.password?.message?.toString()}</p>}
                    <input type="text" placeholder="Enter group name:" required className="appearance-none w-full bg-slate-900 rounded text-gray-200 px-2 py-1 hover:shadow-glow-2"
                    {...register("groupName", {
                        value: formData.groupName,
                        required: true,
                        onChange: e => setFormData({...formData, [e.target.name]: e.target.value})
                    })} />

                    <label className="block text-gray-300 font-semibold mb-1 ml-1 mt-2" >Group members:</label>
                    <Scrollbars className="overflow-x-auto overflow-y-hidden min-h-16 p-1"
                    renderThumbHorizontal={ ({...props}) => <div {...props} className="bg-slate-500 rounded-full"/> }>
                        <div className="flex gap-2 h-16">{
                            formData.members.map(name => Member(name))
                        }</div>
                    </Scrollbars>

                    <div className="flex rounded p-2 m-1 bg-slate-900 gap-2 border-2 border-transparent focus-within:border-slate-200">
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
                        bestUsers.map(e => SearchContact(e, formData, setFormData, setBestUsers, setSearchInput, forceUpdate, setForceUpdate))
                    }</ul>

                    <button type="submit" className="bg-green-700 rounded p-1.5 font-semibold self-center" onClick={handleSubmit(onSubmit)}>
                        Create group
                    </button>
                </form>
            </div>
        </Popup>
    )
}