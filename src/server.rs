use std::{collections::HashMap, time::{SystemTime, UNIX_EPOCH}};

use actix::prelude::*;
use actix::{Actor, Context, Handler, Message, Recipient};
use log::{debug, info, warn};
use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::db::{self, Pool};

#[derive(Message, Deserialize, Serialize, Clone, Debug)]
#[rtype(result = "()")]
pub struct WsMessage {
    pub msg: String,
    pub sender: String,
    pub time: u64,
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

#[derive(Debug, Clone)]
pub struct ChatServer {
    pub sessions: HashMap<String, Recipient<WsMessage>>,
    pub db: Pool
}

impl Actor for ChatServer {
    type Context = Context<Self>;
}

impl Handler<Connect> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: Connect, _: &mut Self::Context) -> Self::Result {
        info!("{} connected to the server", msg.id);

        self.sessions.insert(msg.id, msg.addr);
    }
}

impl Handler<Disconnect> for ChatServer {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, ctx: &mut Self::Context) -> Self::Result {
        info!("{} disconnected from the server", msg.id);

        let username = msg.id.clone();
        let db = self.db.clone();
        let fut = async move {
            db::execute(&db, move |conn| {
                conn.execute(
                    "UPDATE users SET last_time = ?1 WHERE username = ?2", 
                    params![SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64, username]
                )
            }).await.unwrap();
        };
        ctx.spawn(actix::fut::wrap_future(fut));

        self.sessions.remove(&msg.id);
    }
}

impl Handler<WsMessage> for ChatServer {
    type Result = ();
    
    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) -> Self::Result {
        warn!("Sent message {msg:?}");

        match self.sessions.get(&msg.recv) {
            Some(addr) => 
                addr.do_send(WsMessage { 
                    sender: msg.recv.clone(), 
                    recv: msg.sender.clone(),
                    ..msg.clone()
                }),
            None => debug!("Not propagated!!")
        };

        let db = self.db.clone();
        let fut = async move {
            db::execute(&db, move |conn| {
                conn.execute(
                    "INSERT INTO msgs (sender, recv, msg, timestamp) 
                    VALUES (?1, ?2, ?3, ?4);", 
                    params![msg.sender, msg.recv, msg.msg, msg.time]
                )
            }).await.unwrap();
        };
        ctx.spawn(actix::fut::wrap_future(fut));
    }    
}