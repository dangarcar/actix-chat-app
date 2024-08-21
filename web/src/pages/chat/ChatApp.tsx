import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import Loading from "../../components/Loading";
import { LogOut, MessageCirclePlus, UserRoundPlus } from "lucide-react";
import ContactsBar, { IChatPreview } from "./ContactsBar";
import Chat from "./Chat";
import AddContact from "./AddContact";
import TopBar from "./TopBar";
import ChatInfo, { IChatInfo } from "./ChatInfo";
import { Message } from "./ChatMessage";
import { getServerUrl } from "../App";
import UserImage, { uploadImage } from "../../components/UserImage";
import UpdateBio from "./UpdateBio";

export async function readMessage(user: string, lastChats: Map<string, IChatPreview>, setLastChats: React.Dispatch<React.SetStateAction<Map<string, IChatPreview>>>) {
    const response = await fetch(getServerUrl(`/read/${user}`), {method: 'POST'});

    if(!response.ok)
        throw Error("Couldn't read the messages");

    setLastChats(new Map(Array.from(lastChats, ([k, v]) => {
        if(k === user)
            return [k, {
                ...v,
                unread: 0
            }];

        return [k, v];
    })));
}

export default function ChatApp() {
    const { user, getServerUser, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState<WebSocket>();
    const [bioPopupOpen, setBioPopupOpen] = useState(false);
    const [contactsPopupOpen, setContactsPopupOpen] = useState(false);
    const [currentChat, setCurrentChat] = useState<IChatInfo>();
    const [lastChats, setLastChats] = useState<Map<string, IChatPreview>>(new Map());

    const navigate = useNavigate();

    const onMessage = useCallback(e => {
        const msg: Message = JSON.parse(e.data);

        const chats: [string, IChatPreview][] = Array.from(lastChats, ([k, v]) => {
            if(k === msg.sender)
                return [k, {
                    ...v,
                    unread: v.unread + 1
                }];
            
            return [k, v];
        });
        setLastChats(new Map(chats));

        if(!currentChat) {
            console.warn("There isn't any current chats");
            return;
        } 
        if(currentChat.name === msg.sender) {
            readMessage(msg.sender, lastChats, setLastChats);
        }
        
        setCurrentChat({
            ...currentChat,
            msgs: currentChat.msgs.concat(msg),
        });
    }, [lastChats, currentChat]);

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
        let soc = new WebSocket(wsUri);
        soc.onmessage = onMessage;
        setSocket(soc);
    }, [onMessage, window.location, navigate]);

    const onUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(!e.target.files || !e.target.files[0]) {
            console.warn("There are no files :(");
            return;
        }

        const file = e.target.files[0];
        const image = new Image();
        image.src = URL.createObjectURL(file);
        image.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext("2d");

            canvas.width = 256;
            canvas.height = 256;
            ctx?.drawImage(image, 0, 0, 256, 256);

            try {
                await uploadImage(canvas.toDataURL('image/webp'));
                location.reload();
            } catch(err) {
                console.warn(err);
            }
        };
    }

    if(isLoading) {
        return <Loading />
    }

    return (
        <div className="h-screen w-screen flex justify-center items-center" >
            <div className="w-[1600px] h-[850px] shadow-glow-1 rounded flex flex-col">
                <div className="flex h-16">
                    <div className="w-1/4 bg-lime-800 inline-block align-middle border-r border-slate-400">
                        <label htmlFor="image-zone" className="flex float-left m-2 cursor-pointer">
                            <UserImage name={user?.username!} size={"md"} />
                            <input type="file" id="image-zone" name="image-zone" onChange={onUploadImage} accept="image/*" className="" hidden/>
                        </label>
                        <LogOut size={36} className="float-right m-2 mt-3 hover:scale-110 cursor-pointer" onClick={e => logout()}/>
                        
                        <MessageCirclePlus size={36} className="float-right m-2 mt-3 hover:scale-110 cursor-pointer" onClick={e => setBioPopupOpen(true)}/>
                        <UpdateBio open={bioPopupOpen} setOpen={setBioPopupOpen} />

                        <UserRoundPlus size={36} className="float-right m-2 mt-3 hover:scale-110 cursor-pointer" onClick={e => setContactsPopupOpen(true)} />
                        <AddContact open={contactsPopupOpen} setOpen={setContactsPopupOpen} />
                    </div>
                
                    {currentChat? <TopBar {...currentChat}/> : <></>}
                </div>
                
                <div className="flex flex-shrink-0 flex-nowrap grow min-h-0">
                    <ContactsBar setCurrentChat={setCurrentChat} lastChats={lastChats} setLastChats={setLastChats}/>

                    {currentChat? <>
                        <Chat socket={socket!} currentChat={currentChat} setCurrentChat={setCurrentChat}/>
                        <ChatInfo {...currentChat}/> 
                    </>: <></>}
                </div>
            </div>
        </div>
    );
}