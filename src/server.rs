use std::collections::HashMap;

use actix::{Actor, Context, Handler, Message, Recipient};
use log::debug;

#[derive(Message)]
#[rtype(result = "()")]
pub struct WsMessage {
    pub text: String,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Connect {
    pub id: u64,
    pub addr: Recipient<WsMessage>,
}

#[derive(Message)]
#[rtype(result = "()")]
pub struct Disconnect {
    pub id: u64,
}

#[derive(Debug, Default, Clone)]
pub struct ChatServer {
    sessions: HashMap<u64, Recipient<WsMessage>>
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