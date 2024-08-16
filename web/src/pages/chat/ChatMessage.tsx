import React from "react"
import UserImage from "../../components/UserImage"

export interface Message {
    msg: string,
    time: number,
    sender: string,
    recv: string,
}

interface ChatMessageProps {
    mine: boolean,
    msg: Message,
    key: string,
}

function unixTimeToHour(time: number) {
    return new Date(time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessage(props: ChatMessageProps) {
    const regexEmoji = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u{1F9B0}-\u{1F9B3}]+/gu;
    const allEmoji = props.msg.msg.match(regexEmoji)?.join() === props.msg.msg;

    const message = <div className={"max-w-80 rounded p-2 " + (props.mine? "bg-cyan-900 self-end" : "bg-slate-800")}>
        {!props.mine && <p className="text-sm font-semibold" >{props.msg.sender}</p>}
        <p className={allEmoji? "text-3xl":"text-sm"} >
            {props.msg.msg} 
            <sub className="text-sm text-slate-400 translate-x-4 translate-y-4 select-none">&ensp;{unixTimeToHour(props.msg.time)}</sub>
        </p>
    </div>;

    if(!props.mine) {
        return <div className="flex gap-3">
            <UserImage size={"sm"} name={props.msg.sender} className="" />
            {message}
        </div>
    }

    return message;
}