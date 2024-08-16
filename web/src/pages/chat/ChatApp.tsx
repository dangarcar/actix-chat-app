import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import Loading from "../../components/Loading";
import { MessageCirclePlus, UserRoundPlus } from "lucide-react";
import userImage from "../../assets/user.png";
import ContactsBar from "./ContactsBar";
import Chat from "./Chat";
import CreateGroup from "./CreateGroup";
import AddContact from "./AddContact";
import TopBar from "./TopBar";
import ChatInfo, { IChatInfo } from "./ChatInfo";

export default function ChatApp() {
    const { user, getServerUser, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();
    const [groupPopupOpen, setGroupPopupOpen] = useState(false);
    const [contactsPopupOpen, setContactsPopupOpen] = useState(false);
    const [currentChat, setCurrentChat] = useState<IChatInfo>();

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
        <div className="h-screen w-screen flex justify-center items-center" >
            <div className="w-[1600px] h-[850px] shadow-glow-1 rounded flex flex-col">
                <div className="flex h-16">
                    <div className="w-1/4 bg-lime-800 inline-block align-middle border-r border-slate-400">
                        <img src={userImage} alt="PFP" width="48" height="48" className="float-left m-1.5 rounded-3xl hover:scale-110 cursor-pointer select-none" onClick={e => logout()}/>
                        <MessageCirclePlus size={36} className="float-right m-2 mt-3 text-slate-400" onClick={e => {}/*setGroupPopupOpen(true)}*/}/>                        
                        <CreateGroup open={groupPopupOpen} setOpen={setGroupPopupOpen}/>
                        
                        <UserRoundPlus size={36} className="float-right m-2 mt-3 hover:scale-110 cursor-pointer" onClick={e => setContactsPopupOpen(true)} />
                        <AddContact open={contactsPopupOpen} setOpen={setContactsPopupOpen} />
                    </div>
                
                    {currentChat? <TopBar {...currentChat}/> : <></>}
                </div>
                
                <div className="flex flex-shrink-0 flex-nowrap grow min-h-0">
                    <ContactsBar setCurrentChat={setCurrentChat}/>

                    {currentChat? <>
                        <Chat socket={socket!} currentChat={currentChat}/>
                        <ChatInfo {...currentChat}/> 
                    </>: <></>}
                </div>
            </div>
        </div>
    );
}