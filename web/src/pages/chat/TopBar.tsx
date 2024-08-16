import React from "react";
import UserImage from "../../components/UserImage";
import { IChatInfo } from "./ChatInfo";

export default function TopBar(data: IChatInfo) {
    return <div className="grow bg-red-900">
        <UserImage size="md" className="float-left m-1.5" name={data.name}/>
        <p className="m-2 mb-0 text-lg font-semibold">{data.name}</p>
        <p className="text-sm font-light leading-3">{data.lastTime? data.lastTime.toLocaleString('es-ES') : "Online"}</p>
    </div>
}