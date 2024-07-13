use static_files::NpmBuild;

fn main() -> std::io::Result<()> {
    NpmBuild::new("web")
        .install()?
        .run("dev-build")?
        .target("web/dist/bundle")
        .to_resource_dir()
        .build()
}