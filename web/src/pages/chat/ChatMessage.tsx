import React from "react"
import UserImage from "../../components/UserImage"
import { getServerUrl } from "../../App";
import { CheckCheck } from "lucide-react";

export interface Message {
    msg: string,
    time: number,
    sender: string,
    recv: string,
    read: boolean
}

export function unixTimeToHour(time: number) {
    return new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const MESSAGE_PAGE_SIZE = 20;
export async function loadMessages(name: string, page: number): Promise<Message[]> {
    const offset = MESSAGE_PAGE_SIZE * page;
    const msgResponse = await fetch(getServerUrl(`/msgs/${name}?size=${MESSAGE_PAGE_SIZE}&offset=${offset}`));
   
    if(!msgResponse.ok)
        throw Error(await msgResponse.text());

    const msgs: Message[] = await msgResponse.json();
    msgs.reverse();
    return msgs;
}

export default function ChatMessage({mine, msg}: {
    mine: boolean,
    msg: Message,
}) {
    const regexEmoji = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]+/gu;
    const allEmoji = msg.msg.match(regexEmoji)?.join() === msg.msg;

    const message = <div className={"max-w-80 rounded p-2 pb-0.5 " + (mine? "bg-cyan-900 self-end" : "bg-slate-800")}>
        {!mine && <p className="text-sm font-semibold" >{msg.sender}</p>}
        <p className={`${allEmoji? "text-3xl":"text-sm"}`} >{msg.msg}</p>
        <p className="text-xs text-slate-400 select-none float-right">
            {unixTimeToHour(msg.time)}
            {mine && <span className={`${msg.read? 'text-teal-300': 'text-slate-500'} inline-block relative align-bottom ml-1`}><CheckCheck size={12}/></span>}
        </p>
    </div>;

    if(!mine) {
        return <div className="flex gap-3">
            <UserImage size={"sm"} name={msg.sender} className="" />
            {message}
        </div>
    }

    return message;
}