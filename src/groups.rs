use std::collections::{HashMap, HashSet};

use actix_session::Session;
use actix_web::{error, get, post, web, Responder, ResponseError};
use log::info;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use crate::{auth::validate_session, db::{self, execute, Pool}};

#[derive(Debug, Clone, Serialize)]
struct Group {
    id: u64,
    name: String,
    people: HashSet<String>,
    last_time: u64,
}

#[derive(Debug)]
struct QueryResult {
    id: u64,
    name: String,
    last_time: u64,
    username: String
}

#[get("/user-groups")]
pub async fn get_user_groups(session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {
    let id = validate_session(&session)?;

    let group_response: Vec<_> = db::execute(&db, move |conn| {
        let mut stmt = conn.prepare(
            "SELECT groups.id, groups.name, groups.last_time, users.username
            FROM users_groups
            INNER JOIN users ON users.id = users_groups.user_id
            INNER JOIN groups ON groups.id = users_groups.group_id AND groups.id IN (SELECT group_id AS id FROM users_groups WHERE user_id = (?1))
            ORDER BY groups.last_time DESC;"
        )?;

        let response = stmt.query_map(
            params![id], 
            |row| Ok(QueryResult{
                id: row.get(0)?,
                name: row.get(1)?,
                last_time: row.get(2)?,
                username: row.get(3)?
            })
        )?;

        response.into_iter().collect()
    }).await?;

    let mut group_map = HashMap::<u64, Group>::new();
    for q in group_response {
        if let Some(g) = group_map.get_mut(&q.id) {
            g.people.insert(q.username);
        } else {
            let mut people = HashSet::new();
            people.insert(q.username);
            group_map.insert(q.id, Group {
                id: q.id,
                name: q.name,
                last_time: q.last_time,
                people
            });
        }
    }

    let result: Vec<_> = group_map.values().cloned().collect();
    Ok(web::Json(result))
}

#[derive(Debug, Deserialize)]
struct CreateGroup {
    name: String,
    people: Vec<String>
}

#[post("/create-group")]
pub async fn create_group(session: Session, db: web::Data<Pool>, input: web::Json<CreateGroup>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;

    let rows_affected = db::execute(&db, move |conn| {
        let group_id: u64 = conn.query_row(
            "INSERT INTO groups (name, last_time) VALUES (?1, unixepoch('now')) RETURNING (id)", 
            params![input.name],
            |row| row.get(0)
        )?;

        let mut rows = 0;

        for p in input.people.iter() {
            rows = rows + conn.execute(
                "INSERT INTO users_groups (user_id, group_id, role) 
                SELECT id AS user_id, (?1) AS group_id, id = (?2) AS role 
                FROM users WHERE username = (?3);", 
                params![group_id, user_id, p]
            )?;
        }

        Ok(rows)
    }).await?;

    Ok(format!("Group created successfully -> {rows_affected}"))
}

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
            INNER JOIN users ON users.id = user2
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

#[post("/add-contact/{username}")]
pub async fn add_contact(session: Session, db: web::Data<Pool>, username: web::Path<String>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;

    db::execute(&db, move |conn| {
        conn.execute(
            "INSERT INTO contacts (user1, user2) 
            VALUES (?1, (SELECT id FROM users WHERE username = ?2))", 
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
            "DELETE FROM contacts WHERE user1 = ?1 AND user2 = (SELECT id FROM users WHERE username = ?2)", 
            params![user_id, username.into_inner()]
        )
    }).await?;

    if rows == 0 {
        Err(error::ErrorInternalServerError("It wasn't removed"))
    } else {
        Ok("Removed from contacts")
    }

}