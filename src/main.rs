use std::env;

use actix_session::{storage::CookieSessionStore, SessionMiddleware};
use actix_web::{cookie::Key, get, middleware::Logger, web, App, HttpServer, Responder};

use auth::{delete_user, get_user, login, logout, signup};
use db::init_database;
use dotenv::dotenv;
use groups::{create_group, get_user_groups};
use local_ip_address::local_ip;
use log::{info, LevelFilter};

// This may be very ugly but it's needed for the file bundling
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

mod auth;
mod db;
mod groups;

#[get("/hello/{name}")]
async fn greet(name: web::Path<String>) -> impl Responder {
    format!("Hello {name}!")
}

#[get("/secure")]
async fn secure() -> impl Responder {
    "This is definitely secure"
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

    HttpServer::new(move || {
        let generated = generate();

        let session_key = Key::from(env::var("SESSION_KEY").unwrap().as_bytes());

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(
                SessionMiddleware::builder(CookieSessionStore::default(), session_key)
                .cookie_secure(false)
                .cookie_same_site(actix_web::cookie::SameSite::Strict)
                .build()
            )
            .wrap(Logger::default())
            .service(greet)
            .service(secure)
            
            //USER
            .service(get_user)
            .service(signup)
            .service(login)
            .service(logout)
            .service(delete_user)
            
            //GROUPS
            .service(get_user_groups)
            .service(create_group)
            
            .service(actix_web_static_files::ResourceFiles::new("/", generated))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}