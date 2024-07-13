import { Search } from "lucide-react";
import React, { useState } from "react";
import UserImage from "../../components/UserImage";
import Scrollbars from "react-custom-scrollbars-2";
import { Message } from "./ChatMessage";

export interface Contact {
    name: string,
    lastMessage: Message
}

function Contact(contact: Contact) {
    return <div className="p-2 hover:bg-slate-700 cursor-pointer shrink-0">
        <UserImage size={"md"} name={contact.name} className="float-left mr-2"/>
        <p className="font-medium text-slate-100" >{contact.name}</p>
        <p className="text-sm font-light text-slate-300" >{contact.lastMessage.msg}</p>
    </div>
}

export default function ContactsBar() {
    const [searchInput, setSearchInput] = useState("");

    const lastChats: Contact[] = [{name: "Perico", lastMessage: {msg: "Hola su colega", sender: "perico", time: new Date(2023, 5)}}, {name: "Joselito", lastMessage: {msg: "Buesnas tardes", sender: "paquito", time: new Date(1989)}}];

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
        e.preventDefault();
        setSearchInput(e.target.value);
        console.log(searchInput);
        console.log(e.target.value);
    }

    return <div className="bg-slate-800 border-r border-slate-600 flex flex-col w-1/4 h-[786px]">
        <div className="flex rounded p-2 m-2 bg-slate-900 gap-2 border-2 border-transparent focus-within:border-slate-200">
            <Search size={24} />
            <input 
                type="text"
                placeholder="Search contact or group..."
                value={searchInput}
                onChange={handleChange}
                className="bg-transparent focus:outline-none grow"
            />
        </div>
        <Scrollbars className="overflow-auto min-h-0"
        renderThumbVertical={ ({...props}) => <div {...props} className="bg-slate-500 rounded-full"/> }>
            <div className="flex flex-col flex-nowrap">
                {lastChats.map(e => Contact(e))}
                {lastChats.map(e => Contact(e))}
            </div>
        </Scrollbars>
    </div>
}