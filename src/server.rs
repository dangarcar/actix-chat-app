use std::collections::HashMap;

use actix::{Actor, Context, Handler, Message, Recipient};
use log::{debug, warn};
use serde::{Deserialize, Serialize};

#[derive(Message, Deserialize, Serialize, Clone, Debug)]
#[rtype(result = "()")]
pub struct WsMessage {
    pub msg: String,
    pub sender: String,
    pub time: i64,
    pub recv: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Connect {
    pub id: String,
    pub addr: Recipient<WsMessage>,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: String,
}

#[derive(Debug, Default, Clone)]
pub struct ChatServer {
    pub sessions: HashMap<String, Recipient<WsMessage>>
}

impl Actor for ChatServer {
    type Context = Context<Self>;
}

impl Handler<Connect> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: Connect, _: &mut Self::Context) -> Self::Result {
        println!("{} connected to the server", msg.id);

        self.sessions.insert(msg.id, msg.addr);
    }
}

impl Handler<Disconnect> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _: &mut Self::Context) -> Self::Result {
        debug!("{} disconnected from the server", msg.id);

        self.sessions.remove(&msg.id);
    }
}

impl Handler<WsMessage> for ChatServer {
    type Result = ();
    
    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) -> Self::Result {
        warn!("Sent message {msg:?}");
    }    
}