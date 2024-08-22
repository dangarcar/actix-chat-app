import React from "react";
import { BarLoader } from "react-spinners";

export default function Loading() {
    return <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col">
            <p className="text-gray-100 mb-4 text-xl self-center">Loading...</p>
            <BarLoader 
                className="shadow-glow-1 rounded"
                color="#0000FF"
                width={700}
                height={16}
            />
        </div>
    </div>
}