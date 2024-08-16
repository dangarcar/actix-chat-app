use actix_session::Session;
use actix_web::{ delete, error, get, post, web, Responder };
use argon2::{ password_hash::{ rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString }, Argon2 };
use log::info;
use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::db::{self, Pool};

const SESSION_KEY: &'static str = "user_id";

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
pub struct User {
    username: String,
    password: String,
}

#[derive(Deserialize, Debug, Default, Clone)]
struct SignUpInput {
    username: String,
    password: String
}

#[derive(Serialize, Debug, Default, Clone)]
struct SignUpResponse {
    access_token: String,
}

#[post("/create")]
pub async fn signup(input: web::Json<SignUpInput>, session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let hashed_password = Argon2::default()
        .hash_password(input.password.as_bytes(), &salt)
        .map_err(|_| error::ErrorUnauthorized("Couldn't hash the password"))?
        .to_string();
    
    let user_id = db::execute(&db, move |conn| {
        conn.query_row(
            "INSERT INTO users (username, password) VALUES (?1, ?2) RETURNING (username)",
            params![input.username, hashed_password],
            |row| row.get(0)
        ) as Result<String, rusqlite::Error>
    })
    .await
    .map_err(|_| error::ErrorUnauthorized("Couldn't create user"))?;

    session.insert(SESSION_KEY, user_id).unwrap();

    Ok("Welcome!")
}

#[derive(Deserialize, Debug, Default, Clone)]
struct LoginData {
    username: String,
    password: String
}

#[post("/login")]
pub async fn login(input: web::Json<LoginData>, session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {    
    let username = input.username.clone();

    info!("{username}");

    let user = db::execute(&db, move |conn| {
        conn.query_row(
            "SELECT username, password FROM users WHERE username = (?1)",
            params![username],
            |row| Ok(User {
                username: row.get(0)?,
                password: row.get(1)?
            })
        )
    })
    .await
    .map_err(|_| error::ErrorUnauthorized("Couldn't login user"))?;

    info!("{user:?}");

    let hashed_password = PasswordHash::new(&user.password)
        .map_err(|_| error::ErrorUnauthorized("Bad password in database"))?;
    
    match Argon2::default().verify_password(input.password.as_bytes(), &hashed_password) {
        Ok(_) => {
            session.insert(SESSION_KEY, user.username).unwrap();
            Ok("Welcome!")
        }
        Err(_) => {
            Err(error::ErrorUnauthorized("Wrong password"))
        }
    }
}

#[delete("/logout")]
pub async fn logout(session: Session) -> Result<impl Responder, error::Error> {
    session.remove(SESSION_KEY);

    Ok("You are out!")
}

#[delete("/deleteuser")]
pub async fn delete_user(session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {
    let username = validate_session(&session)?;
    
    db::execute(&db, move |conn| {
        conn.execute(
            "DELETE FROM users WHERE username = (?1)", 
            params![username]
        )
    }).await?;
    
    session.remove(SESSION_KEY);

    Ok("You are out!")
}

#[derive(Serialize, Debug, Default, Clone)]
struct UserResponse {
    username: String
}

#[get("/user")]
async fn get_user(session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {
    let username = validate_session(&session)?;

    /*let user_response = db::execute(&db, move |conn| {
        conn.query_row(
            "SELECT (username) FROM users WHERE id = (?1)",
            params![id], 
            |row| Ok( UserResponse {
                username: row.get(0)?
            })
        )
    }).await?;*/

    Ok(web::Json(username))
}

pub fn validate_session(session: &Session) -> Result<String, error::Error> {
    let id: Option<String> = session.get(SESSION_KEY).unwrap_or(None);

    match id {
        Some(id) => {
            // keep the user's session alive
            session.renew();
            Ok(id)
        }
        None => Err(actix_web::error::ErrorUnauthorized("Unathorized")),
    }
}