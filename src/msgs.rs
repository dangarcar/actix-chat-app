use std::{fs::{self, File}, io::Write};

use actix_session::Session;
use actix_web::{error, get, post, web, Responder};
use dataurl::DataUrl;
use log::warn;
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

#[post("/read/{username}")]
pub async fn read(session: Session, db: web::Data<Pool>, username: web::Path<String>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;

    db::execute(&db, move |conn| {
        conn.execute(
            "UPDATE msgs SET read = 1 WHERE recv = ?1 AND sender = ?2;", 
            params![user_id, username.into_inner()]
        )
    }).await?;

    Ok("Read")
}

#[derive(Debug, Deserialize)]
struct ImageData {
    data: String
}

#[post("/upload-image")]
pub async fn upload_image(session: Session, image_data: web::Json<ImageData>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;
    let data_url = DataUrl::parse(&image_data.data)
        .map_err(|_| error::ErrorBadRequest("No image uploaded"))?;

    if data_url.get_media_type() != "image/webp" {
        warn!("Bad type: {}", data_url.get_media_type());
        return Err(error::ErrorBadRequest("Image wasn't a WebP"));
    }

    let bytes = data_url.get_data();
    let mut file = File::create(format!("data/img/{user_id}.webp"))
        .map_err(|_| error::ErrorInternalServerError("Couldn't create image in the server"))?;
    file.write_all(bytes)
        .map_err(|_| error::ErrorInternalServerError("Couldn't save image in the server"))?;
    
    Ok("done")
}

#[get("/image/{username}")]
pub async fn get_image(session: Session, username: web::Path<String>) -> Result<impl Responder, error::Error> {
    let _ = validate_session(&session)?;
    let username = username.into_inner();

    let bytes = fs::read(format!("data/img/{username}.webp"))
        .map_err(|_| error::ErrorInternalServerError("Couldn't read image from the server"))?;
    let mut data_url = DataUrl::new();
    data_url.set_data(&bytes);
    data_url.set_media_type(Some("image/webp".to_string()));

    Ok(data_url.to_string())
}