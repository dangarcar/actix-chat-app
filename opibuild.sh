# It's a script to bundle into a executable the web server
# Argument 1 is the name of the user in the orange pi and argument 2 is the ip adress of the Orange Pi, used to connect through ssh


if [ -z "$1" ]; then
    echo "Missing argument, name of the user of the Orange Pi"
    exit 1
fi

if [ -z "$2" ]; then
    echo "Missing argument, ip address of the Orange Pi"
    exit 2
fi

echo "Building for $1 with IP $2"

rm -rf web/dist
cargo build --target=armv7-unknown-linux-gnueabihf --release
echo "Project compiled successfully"

scp target/armv7-unknown-linux-gnueabihf/release/actix-server $1@$2:/home/$1/actix-server