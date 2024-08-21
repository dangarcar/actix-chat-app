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