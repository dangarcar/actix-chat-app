use std::time::{SystemTime, UNIX_EPOCH};

use actix_session::Session;
use actix_web::{delete, error, post, web, Responder};
use argon2::{password_hash::{rand_core::OsRng, SaltString}, Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use log::info;
use rusqlite::params;
use serde::Deserialize;

use crate::db::{self, Pool};

const USER_ID_KEY: &'static str = "user_id";

#[derive(Deserialize, Debug, Default, Clone)]
struct LoginData {
    username: String,
    password: String
}

#[post("/create")]
pub async fn signup(input: web::Json<LoginData>, session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let hashed_password = Argon2::default()
        .hash_password(input.password.as_bytes(), &salt)
        .map_err(|_| error::ErrorUnauthorized("Couldn't hash the password"))?
        .to_string();
    
    let user_id = db::execute(&db, move |conn| {
        conn.query_row(
            "INSERT INTO users (username, password, last_time, bio) VALUES (?1, ?2, ?3, ?4) RETURNING (username)",
            params![
                input.username, 
                hashed_password, 
                SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64, 
                format!("Good morning, I'm {}", input.username)
            ],
            |row| row.get(0)
        ) as Result<String, rusqlite::Error>
    })
    .await
    .map_err(|_| error::ErrorUnauthorized("Couldn't create user"))?;

    session.insert(USER_ID_KEY, user_id).unwrap();

    Ok("Welcome!")
}

#[post("/login")]
pub async fn login(input: web::Json<LoginData>, session: Session, db: web::Data<Pool>) -> Result<impl Responder, error::Error> {    
    let username = input.username.clone();

    info!("{username}");

    let user = db::execute(&db, move |conn| {
        conn.query_row(
            "SELECT username, password FROM users WHERE username = ?1",
            params![username],
            |row| Ok(LoginData {
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
            session.insert(USER_ID_KEY, user.username).unwrap();
            Ok("Welcome!")
        }
        Err(_) => {
            Err(error::ErrorUnauthorized("Wrong password"))
        }
    }
}

#[delete("/logout")]
pub async fn logout(session: Session) -> Result<impl Responder, error::Error> {
    session.purge();
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
    
    session.purge();
    Ok("You are out!")
}

pub fn validate_session(session: &Session) -> Result<String, error::Error> {
    let user_id: Option<String> = session.get(USER_ID_KEY).unwrap_or(None);

    match user_id {
        Some(user_id) => {
            // keep the user's session alive
            session.renew();
            Ok(user_id)
        }
        None => Err(actix_web::error::ErrorUnauthorized("Unathorized")),
    }
}