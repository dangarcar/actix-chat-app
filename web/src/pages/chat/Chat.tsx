import { SendHorizontal, Smile } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import EmojiPicker, { Emoji, EmojiStyle, Theme } from "emoji-picker-react";
import { useAuth } from "../../components/AuthProvider";
import Scrollbars from "react-custom-scrollbars-2";
import ChatMessage, { Message } from "./ChatMessage";
import { IChatInfo } from "./ChatInfo";

interface ChatData {
    socket: WebSocket,
    currentChat: IChatInfo,
}

export default function Chat(data: ChatData) {
    const { user } = useAuth();
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [messageList, setMessageList] = useState<Message[]>([]); 
    const [messageUpdate, setMessageUpdate] = useState(true)

    const ref = useRef<HTMLDivElement>(null);
    const handleClickOutside = e => {
        e.preventDefault();
        if(ref.current && !ref.current.contains(e.target)) {
            setEmojiOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('click', handleClickOutside, true);
        return () => {
            document.removeEventListener('click', handleClickOutside, true);
        }
    });

    const scrollRef = useRef<HTMLDivElement>(null); 
    useEffect(() => 
        scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    , [scrollRef]);

    data.socket.onmessage = e => { //TODO: this must be a dispatcher
        const msg: Message = {
            msg: e.data,
            sender: data.currentChat.name,
            time: e.timeStamp, //FIXME:
            recv: user?.username!
        }

        messageList.push(msg);
        console.log(messageList);
        
        setMessageList(messageList);
        setMessageUpdate(!messageUpdate); //To refresh inmediately
    };

    const onSendMessage = e => {
        e.preventDefault();
        if(message.length <= 0) 
            return;
        const msg: Message = {
            msg: message,
            sender: user?.username!,
            time: new Date().getTime(),
            recv: data.currentChat.name
        }
        messageList.push(msg);
        setMessageList(messageList)
        setMessage("");

        console.log(user);

        data.socket.send(JSON.stringify(msg));
    }

    return <div className="bg-slate-950 h-full flex flex-col grow overflow-x-hidden">
        <Scrollbars className="max-h-[730px] overflow-y-auto overflow-x-hidden"
        renderThumbVertical={ ({...props}) => <div {...props} className="bg-slate-500 rounded-full"/> }>
            <div ref={scrollRef} className="flex flex-col gap-2 p-2 pr-8">{
                messageList.map(e => <ChatMessage key={new Date(e.time).getTime().toString()} mine={e.sender === user?.username} msg={e}/>)
            }</div>
        </Scrollbars>

        <div className="w-full p-2 bg-slate-700 flex gap-2 justify-center">
            {
                emojiOpen && <div ref={ref} className="rounded bg-slate-800 shadow-glow-2 absolute inset-x-[calc(70%-350px)] inset-y-[calc(87%-450px)] bottom-5 w-fit h-fit">
                    <EmojiPicker 
                        theme={Theme.DARK}
                        emojiStyle={EmojiStyle.NATIVE}
                        onEmojiClick={ e => setMessage(message + e.emoji) }
                    />
                </div>
            }
            <button onClick={ e => setEmojiOpen(true) }>
                <Smile />
            </button>
            <input 
                value={message}
                type="text"
                placeholder="Aa"
                className="bg-slate-800 grow rounded-full p-2 pl-4"
                onChange={ e => setMessage(e.target.value) }
                onKeyDown={ e => {  if(e.key === "Enter") onSendMessage(e); } }
            />
            <button onClick={onSendMessage}>
                <SendHorizontal />
            </button>
        </div>
    </div>
}