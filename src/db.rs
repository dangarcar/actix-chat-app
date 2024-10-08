use std::{fs, path::Path};

use actix_web::web;
use log::{debug, info};
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::Transaction;

pub type Pool = r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>;

pub fn init_database() -> Result<Pool, actix_web::error::Error> {
    if !Path::new("data").exists() {
        fs::create_dir("data/").unwrap();
        fs::create_dir("data/img/").unwrap();
        info!("Database created at data/data.db");
    } else {
        info!("Database found at data/data.db");
    }

    let manager = SqliteConnectionManager::file("data/data.db");
    let pool = Pool::new(manager)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Couldn't create new connection pool"))?;

    pool.get()
        .map_err(|err| actix_web::error::ErrorInternalServerError(err))?
        .execute_batch(
            "
            BEGIN;
            
            CREATE TABLE IF NOT EXISTS users (
	            username	TEXT NOT NULL UNIQUE,
	            password	TEXT NOT NULL,
                last_time   INTEGER,
                bio         TEXT,
	            PRIMARY KEY(username)
            );
            
            CREATE TABLE IF NOT EXISTS contacts (
                user1 TEXT NOT NULL,
                user2 TEXT NOT NULL,
                FOREIGN KEY(user1) 
            		REFERENCES users (username)
                FOREIGN KEY(user2) 
            		REFERENCES users (username)
            );
            CREATE INDEX IF NOT EXISTS contacts_user1_index 
            ON contacts (user1);
            CREATE INDEX IF NOT EXISTS contacts_user2_index 
            ON contacts (user2);

            CREATE TABLE IF NOT EXISTS msgs (
            	msg		TEXT,
            	timestamp	INTEGER,
            	sender	TEXT,
            	recv	TEXT,
                read    INTEGER,
            	FOREIGN KEY(sender) 
            		REFERENCES users (username)
            	FOREIGN KEY(recv) 
                    REFERENCES users (username)
            );
            CREATE INDEX IF NOT EXISTS msgs_sender_index 
            ON msgs (sender);
            CREATE INDEX IF NOT EXISTS msgs_recv_index 
            ON msgs (recv);

            COMMIT;"
        )
        .map_err(|e| { debug!("{e}"); actix_web::error::ErrorInternalServerError("Couldn't create the table")})?;

    Ok(pool)
}

pub async fn execute<T, F>(pool: &Pool, f: F) -> Result<T, actix_web::error::Error>
where 
    T: Send + 'static,
    F: FnOnce(&Transaction) -> Result<T, rusqlite::Error> + Send + 'static,
{
    let pool = pool.clone();

    let mut conn = web::block(move || pool.get())
        .await?
        .map_err(|_| actix_web::error::ErrorInternalServerError("Internal server error"))?;

    web::block(move || {
        let tx = conn.transaction()?;
        let res = f(&tx);
        
        let _ = tx.commit();
        return res;
    })
    .await?
    .map_err(|err| {
        debug!("{err}");
        actix_web::error::ErrorInternalServerError("Database error") 
    })
}