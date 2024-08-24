use std::time::Instant;

use actix::Addr;
use actix_session::Session;
use actix_web::{get, web, HttpRequest, HttpResponse};
use actix_web_actors::ws;

use sessions::WsChatSession;

pub use server::{ChatServer, WsMessage, ReadMessage};

use crate::api::auth::validate_session;

mod server;
mod sessions;

#[get("/ws")]
pub async fn chat_route(
    req: HttpRequest,
    stream: web::Payload,
    srv: web::Data<Addr<ChatServer>>,
    session: Session,
) -> Result<HttpResponse, actix_web::Error> {
    let user_id = validate_session(&session)?;

    ws::start(
        WsChatSession { 
            name: user_id, 
            hb: Instant::now(), 
            addr: srv.get_ref().clone() 
        },
        &req,
        stream,
    )
}