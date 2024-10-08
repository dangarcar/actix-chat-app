use std::env;

use actix::Actor;
use actix_session::{storage::CookieSessionStore, SessionMiddleware};
use actix_web::{cookie::Key, middleware::Logger, web, App, HttpServer};

use api::{auth::*, contacts::*, msgs::*, user::*};
use db::init_database;
use dotenv::dotenv;
use local_ip_address::local_ip;
use log::{info, LevelFilter};
use ws::{chat_route, ChatServer};

// This may be very ugly but it's needed for the file bundling
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

mod db;
mod ws;
mod api;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    env_logger::Builder::new()
        .filter_level(LevelFilter::Debug)
        .init();

    let port = env::var("PORT").unwrap().parse::<u16>().unwrap();

    let ip = local_ip().unwrap();
    info!("Running at http://{ip}:{port}");

    let pool = init_database().unwrap();

    let chat_server = ChatServer {sessions: Default::default(), db: pool.clone() }.start();

    HttpServer::new(move || {
        let generated = generate();

        let session_key = Key::from(env::var("SESSION_KEY").unwrap().as_bytes());

        App::new()
            .app_data(web::Data::new(chat_server.clone()))
            .app_data(web::Data::new(pool.clone()))
            .wrap(
                SessionMiddleware::builder(CookieSessionStore::default(), session_key)
                .cookie_secure(false)
                .cookie_same_site(actix_web::cookie::SameSite::Strict)
                .build()
            )
            .wrap(Logger::default())
            .service(chat_route)
            
            //AUTH
            .service(signup)
            .service(login)
            .service(logout)
            .service(delete_user)
            
            //USER
            .service(get_user)
            .service(upload_image)
            .service(get_image)
            .service(update_bio)
            
            //CONTACTS
            .service(get_contacts)
            .service(add_contact)
            .service(delete_contact)
            .service(contact_info)
            
            //MESSAGES
            .service(get_messages)
            .service(get_unread)
            .service(read)

            .service(actix_web_static_files::ResourceFiles::new("/", generated))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}