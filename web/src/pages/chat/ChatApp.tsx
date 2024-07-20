import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import { getServerUrl } from "../App";
import Loading from "../../components/Loading";
import { MessageCirclePlus, UserRoundPlus } from "lucide-react";
import userImage from "../../assets/user.png";
import UserImage from "../../components/UserImage";
import ContactsBar from "./ContactsBar";
import Chat from "./Chat";
import Popup from "reactjs-popup";

export default function ChatApp() {
    const { user, getServerUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();
    const [groupPopupOpen, setGroupPopupOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const isLogged = async () => {
            try {
                await getServerUser();
                setIsLoading(false);
            } catch(error) {
                console.warn(error);
                navigate("/login");
            }
        }

        isLogged();

        const wsUri = `${window.location.protocol == "https"? 'wss':'ws'}://${window.location.host}/ws`;
        setSocket(new WebSocket(wsUri));
    }, []);

    if(isLoading) {
        return <Loading />
    }

    return (
        <div className="h-screen w-screen flex justify-center items-center">
            <div className="w-[1600px] h-[850px] shadow-glow-1 rounded flex flex-col">
                <div className="flex h-16">
                    <div className="w-1/4 bg-lime-800 inline-block align-middle border-r border-slate-400">
                        <img src={userImage} alt="PFP" width="48" height="48" className="float-left m-1.5 rounded-3xl hover:scale-110 cursor-pointer select-none"/>
                        <MessageCirclePlus size={36} className="float-right m-2 mt-3 hover:scale-110 cursor-pointer" onClick={e => setGroupPopupOpen(true)}/>
                        <Popup 
                            open={groupPopupOpen}
                            closeOnDocumentClick
                            onClose={ e => setGroupPopupOpen(false) }
                        >
                            <div>Me gusta el chorizo</div>
                        </Popup>

                        
                        <UserRoundPlus size={36} className="float-right m-2 mt-3 hover:scale-110 cursor-pointer"/>
                    </div>
                
                    <div className="grow bg-red-900">
                        <UserImage size="md" className="float-left m-1.5" name="Manolo"/>
                        <p className="m-2 mb-0 text-lg font-semibold">Manolo el del Bombo</p>
                        <p className="text-sm font-light leading-3">Es un grande</p>
                    </div>
                </div>
                
                <div className="flex flex-shrink-0 flex-nowrap grow min-h-0">
                    <ContactsBar />
                    <Chat socket={socket!}/>

                    <div className="bg-slate-900 border-l border-slate-600 flex flex-col items-center w-1/4">
                        <UserImage size="xl" className="m-4 mb-0" name="Manolo"/>
                        <p className="m-2 text-3xl font-bold text-slate-200">Manolo el del Bombo</p>
                        <p className="ml-6 mt-2 self-start text-slate-400">About:</p>
                        <p className="m-6 mt-0 text-slate-200">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc non lectus viverra libero fermentum pellentesque id eget lectus. &#128511;</p>
                        <div className="m-2 border w-48 border-slate-300"/>
                    </div>
                </div>
            </div>
        </div>
    );
}