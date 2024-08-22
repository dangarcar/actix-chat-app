use std::{fs::{self, File}, io::Write};

use actix_session::Session;
use actix_web::{error, get, post, web, Responder};
use dataurl::DataUrl;
use log::warn;
use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::db::{self, Pool};
use super::auth::validate_session;

#[derive(Serialize, Debug, Default, Clone)]
struct UserResponse {
    username: String
}

#[get("/user")]
pub async fn get_user(session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;

    //Check if the user exists in the db (needed because of the cookies lifespan)
    let username: String = db::execute(&db, move |conn| {
        conn.query_row(
            "SELECT username FROM users WHERE username = ?1", 
            params![user_id],
            |row| row.get(0)
        )
    }).await?;

    Ok(web::Json(UserResponse { username }))
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

#[derive(Debug, Deserialize)]
struct BioBody {
    bio: String
}

#[post("/bio")]
pub async fn update_bio(session: Session, db: web::Data<Pool>, bio: web::Json<BioBody>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;
    let bio = bio.into_inner().bio;

    db::execute(&db, move |conn| {
        conn.execute(
            "UPDATE users SET bio = ?1 WHERE username = ?2", 
            params![bio, user_id]
        )
    }).await?;

    Ok("Bio updated successfully")
}