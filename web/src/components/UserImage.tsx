import React, { useEffect, useState } from "react";
import { getServerUrl } from "../pages/App";

const imagesCache = new Map<string, string | null>();

function nameToColor(name: string) {
    if(name.length === 0)
        return 0;

    let hash = 0;
    for(let c of name) {
        hash = ((hash << 5) - hash) + c.charCodeAt(0);
        hash &= 0xFFFFFF;
    }

    return hash;
}

export default function UserImage({size, name, className}: {
    size: "sm" | "md" | "xl",
    name: string,
    className?: string
}) {
    useEffect(() => {
        const loadImage = async () => {
            try {
                const response = await fetch(getServerUrl(`/image/${name}`));
                if(response.ok)
                    imagesCache.set(name, await response.text());
                else
                    imagesCache.set(name, null);
            } catch(err) {
                //There's nothing bad about it
            }
        }

        if(!imagesCache.has(name))
            loadImage();
    }, [name]);

    const sizes = {
        "sm": "h-8 w-8",
        "md": "h-12 w-12",
        "xl": "h-32 w-32",
    };
    const pSizes = {
        "sm": "text-2xl leading-[26px]",
        "md": "text-3xl leading-[40px]",
        "xl": "text-8xl leading-[110px]",
    }

    const char = name?.charAt(0).toLocaleUpperCase();

    return <div className={`${className} ${sizes[size]}
    rounded-full border-2 border-slate-100 overflow-hidden z-50`} style={{backgroundColor: '#' + nameToColor(name!).toString(16)}}>
        {imagesCache.get(name)? 
            <img src={imagesCache.get(name)!} className={`${sizes[size]} -z-50 overflow-hidden`}/>
        :
            <p className={"font-bold text-center select-none " + pSizes[size]}>{char}</p>
        }
    </div>;
}

export async function uploadImage(dataURL: string) {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const response = await fetch(getServerUrl("/upload-image"), {
        method: 'POST',
        body: JSON.stringify({ data: dataURL }),
        headers
    });

    if(!response.ok)
        throw Error("Couldn't upload image");
}

const COLOR_PALETTE = [
    "bg-[#170d1c]", 
    "bg-[#312647]", 
    "bg-[#574e69]", 
    "bg-[#75728c]", 
    "bg-[#451a45]",
    "bg-[#75203f]", 
    "bg-[#992f2f]", 
    "bg-[#bf674c]",
    "bg-[#e6bb65]",
    "bg-[#c77394]",
    "bg-[#191e4f]",
    "bg-[#2a4d73]",
    "bg-[#467394]",
    "bg-[#549dbf]",
    "bg-[#6dbadb]",
    "bg-[#85d5de]",
    "bg-[#929fa3]",
    "bg-[#30786e]",
    "bg-[#51a35b]",
    "bg-[#8dc756]",
    "bg-[#401d2e]",
    "bg-[#57373e]",
    "bg-[#914e3a]",
    "bg-[#c7885e]",
    "bg-[#ffbd8a]",
    "bg-[#eb9b9b]",
    "bg-[#8c5c7f]"
];