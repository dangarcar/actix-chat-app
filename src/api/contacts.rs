use actix_session::Session;
use actix_web::{error, get, post, web, Responder};
use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::{api::auth::validate_session, db::{self, Pool}};

#[derive(Debug, Deserialize)]
struct QueryContacts {
    search: Option<String>
}

#[get("/contacts")]
pub async fn get_contacts(session: Session, db: web::Data<Pool>, query: web::Query<QueryContacts>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;
    let query = query.into_inner();

    let contacts: Vec<String> = db::execute(&db, move |conn| {
        let mut stmt = conn.prepare(
            "SELECT users.username FROM contacts 
            INNER JOIN users ON users.username = user2
            WHERE user1 = ?1 AND users.username LIKE (?2);"
        )?;

        let response = stmt.query_map(
            params![user_id, format!("%{}%", query.search.unwrap_or(String::new()))], 
            |row| row.get(0)
        )?;

        response.into_iter().collect()
    }).await?;

    Ok(web::Json(contacts))
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct Contact {
    name: String,
    last_time: Option<u64>,
    bio: String,
}

#[get("/contact/{username}")]
pub async fn contact_info(session: Session, db: web::Data<Pool>, username: web::Path<String>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;

    let contact = db::execute(&db, move |conn| {
        let name = username.into_inner();

        conn.query_row(
            "SELECT users.username, users.last_time, users.bio FROM contacts 
            INNER JOIN users ON users.username = user2
            WHERE user1 = ?1 AND users.username = ?2;", 
            params![user_id, name.clone()],
            |row| Ok(Contact {
                name: row.get(0)?,
                last_time: row.get(1)?,
                bio: row.get(2)?,
            })
        )
    }).await?;

    Ok(web::Json(contact))
}

#[post("/add-contact/{username}")]
pub async fn add_contact(session: Session, db: web::Data<Pool>, username: web::Path<String>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;

    if user_id == username.clone() {
        return Err(error::ErrorBadRequest("You can't be a contact of yourself"));
    }

    db::execute(&db, move |conn| {
        conn.execute(
            "INSERT INTO contacts (user1, user2) 
            VALUES (?1, ?2)", 
            params![user_id, username.into_inner()]
        )
    }).await?;

    Ok("Added to contacts")
}

#[post("/delete-contact/{username}")]
pub async fn delete_contact(session: Session, db: web::Data<Pool>, username: web::Path<String>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;
    
    let rows = db::execute(&db, move |conn| {
        conn.execute(
            "DELETE FROM contacts WHERE user1 = ?1 AND user2 = (?2)", 
            params![user_id, username.into_inner()]
        )
    }).await?;

    if rows == 0 {
        Err(error::ErrorInternalServerError("It wasn't removed"))
    } else {
        Ok("Removed from contacts")
    }

}