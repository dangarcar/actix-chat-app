use std::{env, time::Instant};

use actix::{Actor, Addr};
use actix_session::{storage::CookieSessionStore, Session, SessionMiddleware};
use actix_web::{cookie::Key, get, middleware::Logger, web, App, HttpRequest, HttpResponse, HttpServer};

use actix_web_actors::ws;
use auth::{delete_user, get_user, login, logout, signup, validate_session};
use db::init_database;
use dotenv::dotenv;
use groups::{add_contact, contact_info, create_group, delete_contact, get_contacts, get_user_groups};
use local_ip_address::local_ip;
use log::{info, LevelFilter};
use msgs::{get_messages, get_unread};
use server::ChatServer;
use sessions::WsChatSession;

// This may be very ugly but it's needed for the file bundling
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

mod auth;
mod db;
mod groups;
mod sessions;
mod server;
mod msgs;

#[get("/ws")]
async fn chat_route(
    req: HttpRequest,
    stream: web::Payload,
    srv: web::Data<Addr<ChatServer>>,
    session: Session,
) -> Result<HttpResponse, actix_web::Error> {
    let user_id = validate_session(&session)?;

    ws::start(
        WsChatSession { 
            name: user_id, 
            hb: Instant::now(), 
            addr: srv.get_ref().clone() 
        },
        &req,
        stream,
    )
}

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
            
            //USER
            .service(get_user)
            .service(signup)
            .service(login)
            .service(logout)
            .service(delete_user)
            
            //CONTACTS
            .service(get_contacts)
            .service(add_contact)
            .service(delete_contact)
            .service(contact_info)

            //GROUPS
            .service(get_user_groups)
            .service(create_group)
            
            //MESSAGES
            .service(get_messages)
            .service(get_unread)

            .service(actix_web_static_files::ResourceFiles::new("/", generated))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}