import React from "react"
import UserImage from "../../components/UserImage"
import { Trash2 } from "lucide-react"
import { getServerUrl } from "../../App"
import { Message } from "./ChatMessage"

export interface IChatInfo {
    name: string,
    lastTime?: number,
    bio: string,
    msgs: Message[],
}

export default function ChatInfo(data: IChatInfo) {
    const deleteContact = async () => {
        try {
            const response = await fetch(getServerUrl(`/delete-contact/${data.name}`), { method: 'POST' });

            if(!response.ok)
                throw Error("Couldn't delete contact");

            location.reload(); //FIXME: I'm sure there are better ways to do this
        } catch(err) {
            console.warn(err)
        }
    } 

    return <div className="bg-slate-900 border-l border-slate-600 flex flex-col items-center w-1/4">
        <UserImage size="xl" className="m-4 mb-0" name={data.name}/>
        <p className="m-2 text-3xl font-bold text-slate-200">{data.name}</p>
        <p className="ml-6 mt-2 self-start text-slate-400">About:</p>
        <p className="m-6 mt-0 text-slate-200 self-start">{data.bio}</p>
        <div className="m-2 border w-48 border-slate-300"/>
        <button onClick={deleteContact} className="mt-2 hover:scale-110 text-red-300 flex gap-2">
            <Trash2 /> Remove from contacts
        </button>
    </div>
}