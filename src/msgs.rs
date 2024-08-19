use actix_session::Session;
use actix_web::{error, get, web, Responder};
use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::{auth::validate_session, db::{self, Pool}, server::WsMessage};

const DEFAULT_MESSAGE_PAGE_SIZE: u32 = 10;

#[derive(Debug, Deserialize)]
struct QueryMessage {
    size: Option<u32>,
    offset: Option<u32>,
}

#[get("/msgs/{username}")]
pub async fn get_messages(session: Session, db: web::Data<Pool>, username: web::Path<String>, query: web::Query<QueryMessage>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;
    let username = username.into_inner();
    let query = query.into_inner();

    let msgs: Vec<WsMessage> = db::execute(&db, move |conn| {
        let mut stmt = conn.prepare(
            "SELECT msg, sender, recv, timestamp, read FROM msgs 
            WHERE (sender = ?1 AND recv = ?2) OR (sender = ?2 AND recv = ?1)
            ORDER BY timestamp DESC
            LIMIT ?3 OFFSET ?4;"
        )?;

        let response = stmt.query_map(
            params![user_id, username, query.size.unwrap_or(DEFAULT_MESSAGE_PAGE_SIZE), query.offset.unwrap_or(0)], 
            |row| Ok(WsMessage {
                msg: row.get(0)?,
                sender: row.get(1)?,
                recv: row.get(2)?,
                time: row.get(3)?,
                read: row.get(4)?,
            })
        )?;

        response.into_iter().collect()
    }).await?;

    Ok(web::Json(msgs))
}

#[derive(Debug, Default, Serialize)]
struct UnreadResponse {
    contact: String,
    unread: u32
}

#[get("/unread")]
pub async fn get_unread(session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;

    let unread: Vec<UnreadResponse> = db::execute(&db, move |conn| {
        let mut stmt = conn.prepare(
            "SELECT sender, COUNT(sender) FROM msgs 
            WHERE read = 0 AND recv = ?1
            GROUP BY sender;"
        )?;

        let response = stmt.query_map(
            params![user_id], 
            |row| Ok(UnreadResponse {
                contact: row.get(0)?,
                unread: row.get(1)?
            })
        )?;

        response.into_iter().collect()
    }).await?;

    Ok(web::Json(unread))
}