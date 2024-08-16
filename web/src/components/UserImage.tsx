import React from "react";

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

interface UserImageProps {
    size: "sm" | "md" | "xl",
    name: string,
    className?: string
}

export default function UserImage(data: UserImageProps) {
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

    const char = data.name.charAt(0).toLocaleUpperCase();

    return <div className={`${data.className} ${sizes[data.size]}
    rounded-full border-2 border-slate-100`} style={{backgroundColor: '#' + nameToColor(data.name).toString(16)}}>
        <p className={"font-bold text-center cursor-default " + pSizes[data.size]}>
            {char}
        </p>
    </div>;
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