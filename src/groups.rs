use std::collections::{HashMap, HashSet};

use actix_session::Session;
use actix_web::{error, get, post, web, Responder};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use crate::{auth::validate_session, db::{self, Pool}};

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Group {
    name: String,
    people: HashSet<String>,
}

#[derive(Debug)]
struct QueryResult {
    id: u64,
    name: String,
    username: String
}

#[get("/user-groups")]
pub async fn get_user_groups(session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {
    let id = validate_session(&session)?;

    let group_response: Vec<_> = db::execute(&db, move |conn| {
        let mut stmt = conn.prepare(
            "SELECT groups.id, groups.name, users.username
            FROM users_groups
            INNER JOIN users ON users.id = users_groups.user_id
            INNER JOIN groups ON groups.id = users_groups.group_id AND groups.id IN (SELECT group_id AS id FROM users_groups WHERE user_id = (?1))"
        )?;

        let response = stmt.query_map(
            params![id], 
            |row| Ok(QueryResult{
                id: row.get(0)?,
                name: row.get(1)?,
                username: row.get(2)?
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
                name: q.name,
                people
            });
        }
    }

    let result: Vec<_> = group_map.values().cloned().collect();
    Ok(web::Json(result))
}

#[post("/create-group")]
pub async fn create_group(session: Session, db: web::Data<Pool>, input: web::Json<Group>) -> Result<impl Responder, error::Error> {
    let user_id = validate_session(&session)?;

    

    let rows_affected = db::execute(&db, move |conn| {
        let group_id: u64 = conn.query_row(
            "INSERT INTO groups (name) VALUES (?1) RETURNING (id)", 
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
