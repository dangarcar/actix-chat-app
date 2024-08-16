import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import UserImage from "../../components/UserImage";
import Scrollbars from "react-custom-scrollbars-2";
import { getServerUrl } from "../App";
import ChatInfo, { IChatInfo } from "./ChatInfo";

function Contact({setCurrentChat, chatInfo}: {
    setCurrentChat: (a: IChatInfo) => void,
    chatInfo: IChatInfo
}) {
    const onClick = e => {
        setCurrentChat(chatInfo);
    }

    return <div className="p-2 hover:bg-slate-700 cursor-pointer shrink-0" key={chatInfo.name} onClick={onClick}>
        <UserImage size={"md"} name={chatInfo.name} className="float-left mr-2"/>
        <p className="font-medium text-slate-100" >{chatInfo.name}</p>
        <p className="text-sm font-light text-slate-300" >{chatInfo.lastTime? chatInfo.lastTime.toLocaleString('es-ES') : "Online"}</p>
    </div>
}

export default function ContactsBar({ setCurrentChat }: {setCurrentChat: (a: IChatInfo) => void}) {
    const [searchInput, setSearchInput] = useState("");
    const [lastChats, setLastChats] = useState<IChatInfo[]>([]);
    const [filteredLastChats, setFilteredLastChats] = useState<IChatInfo[]>(lastChats);

    useEffect(() => {
        const callback = async () => {
            try {
                const response = await fetch(getServerUrl("/contacts"));

                if(!response.ok)
                    throw Error(await response.text());

                let chats: Map<string, IChatInfo> = new Map();

                for(let e of await response.json()) {
                    chats.set(e, {
                        name: e,
                        lastTime: new Date(),
                        bio: "Hey, I'm using this app!!!"
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
                {filteredLastChats.map(chatInfo => 
                    Contact( {setCurrentChat, chatInfo} )
                )}
            </div>
        </Scrollbars>
    </div>
}