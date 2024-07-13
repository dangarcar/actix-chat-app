import React from "react";

const COLOR_PALETTE = {
    "A": "bg-[#170d1c]", 
    "B": "bg-[#312647]", 
    "C": "bg-[#574e69]", 
    "D": "bg-[#75728c]", 
    "E": "bg-[#451a45]",
    "F": "bg-[#75203f]", 
    "G": "bg-[#992f2f]", 
    "H": "bg-[#bf674c]",
    "I": "bg-[#e6bb65]",
    "J": "bg-[#c77394]",
    "K": "bg-[#191e4f]",
    "L": "bg-[#2a4d73]",
    "M": "bg-[#467394]",
    "N": "bg-[#549dbf]",
    "O": "bg-[#6dbadb]",
    "P": "bg-[#85d5de]",
    "Q": "bg-[#929fa3]",
    "R": "bg-[#30786e]",
    "S": "bg-[#51a35b]",
    "T": "bg-[#8dc756]",
    "U": "bg-[#401d2e]",
    "V": "bg-[#57373e]",
    "W": "bg-[#914e3a]",
    "X": "bg-[#c7885e]",
    "Y": "bg-[#ffbd8a]",
    "Z": "bg-[#eb9b9b]",
    def: "bg-[#8c5c7f]"
} as const;

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

    return <div className={`${data.className} ${char in COLOR_PALETTE? COLOR_PALETTE[char as keyof typeof COLOR_PALETTE] : COLOR_PALETTE.def} ${sizes[data.size]}
    rounded-full border-2 border-slate-100`} >
        <p className={"font-bold text-center cursor-default " + pSizes[data.size]}>
            {char}
        </p>
    </div>;
}