import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import UserImage from "../../components/UserImage";
import Scrollbars from "react-custom-scrollbars-2";
import { getServerUrl } from "../App";
import { IChatInfo } from "./ChatInfo";

interface IChatPreview {
    name: string,
}

function Contact({setCurrentChat, chatPreview}: {
    setCurrentChat: (a: IChatInfo) => void,
    chatPreview: IChatPreview
}) {
    const onClick = async e => {
        try {
            const response = await fetch(getServerUrl(`/contact/${chatPreview.name}`))

            if(!response.ok)
                throw Error(await response.text());

            const chatInfo: IChatInfo = await response.json();
            setCurrentChat(chatInfo);
        } catch(err) {
            console.warn(err);
        }
    }

    //TODO:
    return <div className="p-2 hover:bg-slate-700 cursor-pointer shrink-0" key={chatPreview.name} onClick={onClick}>
        <UserImage size={"md"} name={chatPreview.name} className="float-left mr-2"/>
        <p className="font-medium text-slate-100" >{chatPreview.name}</p>
        <p className="text-sm font-light text-slate-300" >some random text</p>
    </div>
}

export default function ContactsBar({ setCurrentChat }: {setCurrentChat: (a: IChatInfo) => void}) {
    const [searchInput, setSearchInput] = useState("");
    const [lastChats, setLastChats] = useState<IChatPreview[]>([]);
    const [filteredLastChats, setFilteredLastChats] = useState<IChatPreview[]>(lastChats);

    useEffect(() => {
        const callback = async () => {
            try {
                const response = await fetch(getServerUrl("/contacts"));

                if(!response.ok)
                    throw Error(await response.text());

                let chats: Map<string, IChatPreview> = new Map();

                for(let e of await response.json()) {
                    chats.set(e, {
                        name: e,
                    });
                }

                setLastChats([...chats.values()]);
                setFilteredLastChats([...chats.values()])
            } catch(err) {
                console.warn(err);
            }
        };

        callback();
    }, [setLastChats, setFilteredLastChats]);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
        e.preventDefault();
        const keyword = e.target.value;
        
        setSearchInput(keyword);
        setFilteredLastChats(lastChats.filter(e => e.name.toLowerCase().includes(keyword.toLowerCase())));
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
                {filteredLastChats.map(chatPreview => 
                    Contact( {setCurrentChat, chatPreview} )
                )}
            </div>
        </Scrollbars>
    </div>
}