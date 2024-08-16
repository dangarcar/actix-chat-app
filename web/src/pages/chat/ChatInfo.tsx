import React from "react"
import UserImage from "../../components/UserImage"

export interface IChatInfo {
    name: string,
    lastTime?: Date,
    bio: string
}

export default function ChatInfo(data: IChatInfo) {
    return <div className="bg-slate-900 border-l border-slate-600 flex flex-col items-center w-1/4">
        <UserImage size="xl" className="m-4 mb-0" name={data.name}/>
        <p className="m-2 text-3xl font-bold text-slate-200">{data.name}</p>
        <p className="ml-6 mt-2 self-start text-slate-400">About:</p>
        <p className="m-6 mt-0 text-slate-200 self-start">{data.bio}</p>
        <div className="m-2 border w-48 border-slate-300"/>
    </div>
}