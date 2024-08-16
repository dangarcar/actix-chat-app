use std::time::{Duration, Instant};

use actix::{Actor, ActorContext, Addr, AsyncContext, Running, StreamHandler};
use actix_web_actors::ws;
use log::{debug, info};

use crate::server::{ChatServer, Disconnect, WsMessage};

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(5);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(10);

pub struct WsChatSession {
    pub name: String,
    pub hb: Instant,
    pub addr: Addr<ChatServer>
}   

impl WsChatSession {
    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        ctx.run_interval(HEARTBEAT_INTERVAL, |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                debug!("Websocket Client heartbeat failed, disconnecting!");
                act.addr.do_send(Disconnect { id: act.name.clone() });
                ctx.stop();
                return;
            }
    
            ctx.ping(b"");
        });
    } 
}

impl Actor for WsChatSession {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);
    }

    fn stopping(&mut self, _: &mut Self::Context) -> Running {
        self.addr.do_send(Disconnect { id: self.name.clone() });
        Running::Stop
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsChatSession {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        let msg = match msg {
            Err(_) => { 
                ctx.stop(); 
                return; 
            }
            Ok(msg) => msg
        };

        debug!("Websocket message: {msg:?}");
        match msg {
            ws::Message::Ping(msg) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            ws::Message::Pong(_) => {
                self.hb = Instant::now();
            }
            ws::Message::Close(reason) => {
                ctx.close(reason);
                ctx.stop();
            }
            ws::Message::Continuation(_) => {
                ctx.stop();
            }
            ws::Message::Binary(_) => info!("Unexpected binary"),
            ws::Message::Nop => (),
            
            ws::Message::Text(text) => {
                let msg: WsMessage = serde_json::from_str(&text).unwrap();
                debug!("Deserialized msg: {msg:?}");
                self.addr.do_send(msg);
            }
        }
    }
}