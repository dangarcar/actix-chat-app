import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import UserImage from "../../components/UserImage";
import Scrollbars from "react-custom-scrollbars-2";
import { getServerUrl } from "../../App";
import { IChatInfo } from "./ChatInfo";
import { Message, unixTimeToHour } from "./ChatMessage";
import { readMessage } from "../ChatApp";
import { useAuth } from "../../components/AuthProvider";

const MESSAGE_PAGE_SIZE = 10; //Would need to be changed in the future

export interface IChatPreview {
    name: string,
    unread: number,
    msg?: Message
}

function Contact({setCurrentChat, chatPreview, lastChats, setLastChats}: {
    setCurrentChat: (a: IChatInfo) => void,
    chatPreview: IChatPreview,
    lastChats: Map<string, IChatPreview>,
    setLastChats: React.Dispatch<React.SetStateAction<Map<string, IChatPreview>>>
}) {
    const {user} = useAuth();

    const onClick = async e => {
        try {
            const contactResponse = await fetch(getServerUrl(`/contact/${chatPreview.name}`));
            const msgResponse = await fetch(getServerUrl(`/msgs/${chatPreview.name}?size=${MESSAGE_PAGE_SIZE}`));

            if(!contactResponse.ok)
                throw Error(await contactResponse.text());
            if(!msgResponse.ok)
                throw Error(await msgResponse.text());

            const chatInfo = await contactResponse.json();
            const msgs: Message[] = await msgResponse.json();

            setCurrentChat({
                msgs: msgs.reverse(),
                ...chatInfo
            });

            readMessage(chatPreview.name, lastChats, setLastChats);
        } catch(err) {
            console.warn(err);
        }
    }

    return <div className="p-2 hover:bg-slate-700 cursor-pointer shrink-0 flex" key={chatPreview.name} onClick={onClick}>
        <div className="grow">
            <UserImage size={"md"} name={chatPreview.name} className="float-left mr-2"/>
            <p className="font-medium text-slate-100" >{chatPreview.name}</p>
            {chatPreview.msg?
                <p className="text-sm font-light text-slate-300" >
                    <b>{unixTimeToHour(chatPreview.msg.time)}: </b>
                    {chatPreview.msg.sender === user?.username? " You: ":" "}
                    {chatPreview.msg.msg.length > 40? chatPreview.msg.msg.substring(0, 37) + "..." : chatPreview.msg.msg}
                </p>
                :
                <p className="text-sm font-light text-slate-400" >No message</p>
            }            
        </div>
        {chatPreview.unread != 0 && <div className="rounded-full m-2 bg-emerald-600 border-2 w-8">
            <p className="text-slate-100 font-bold text-center text-lg">{chatPreview.unread}</p>
        </div>}
    </div>
}

export default function ContactsBar({ setCurrentChat, lastChats, setLastChats }: {
    setCurrentChat: (a: IChatInfo) => void,
    lastChats: Map<string, IChatPreview>,
    setLastChats: React.Dispatch<React.SetStateAction<Map<string, IChatPreview>>>
}) {
    const [searchInput, setSearchInput] = useState("");
    const [filteredLastChats, setFilteredLastChats] = useState<IChatPreview[]>([]);

    useEffect(() => {
        const callback = async () => {
            try {
                const contactResponse = await fetch(getServerUrl("/contacts"));
                const response = await fetch(getServerUrl("/unread"));

                if(!response.ok)
                    throw Error(await response.text());
                if(!contactResponse.ok)
                    throw Error(await contactResponse.text());

                let unreads = await response.json();
                let chats: Map<string, IChatPreview> = new Map();

                console.log(unreads);

                for(let cont of await contactResponse.json()) {
                    const unread = unreads.find(e => e.contact == cont.name)?.unread;
                    chats.set(cont.name, {
                        name: cont.name,
                        unread: unread? unread : 0,
                        msg: cont.lastMsg
                    });
                }

                setLastChats(chats);
            } catch(err) {
                console.warn(err);
            }
        };

        callback();
    }, []);

    useEffect(() => {
        setFilteredLastChats([...lastChats.values()]
            .filter(e => e.name.toLowerCase().includes(searchInput.toLowerCase()))
            .sort((a, b) => {
                if(a.msg && b.msg)
                    return b.msg.time - a.msg.time;
                else
                    return (b.msg == undefined? 0: 1) - (a.msg == undefined? 0 : 1)
            })
        );
    }, [lastChats, searchInput, setFilteredLastChats]);

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
        e.preventDefault();
        const keyword = e.target.value; 
        setSearchInput(keyword);
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
                    Contact( {setCurrentChat, chatPreview, lastChats, setLastChats} )
                )}
            </div>
        </Scrollbars>
    </div>
}