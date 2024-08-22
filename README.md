# Chat app

This is a message app that I've made with Actix web and React to be run on an Orange pi that I own.

The app is packed into a executable so it's easier to transport between my computer and the Orange Pi.
The database is a bundled SQLite3 so it could fit into the OPi Zero, since Postgres occupied almost all the RAM.
This app is not meant to be used, is only a prototype with plenty of bugs and it struggles dealing with anything more than 10 users simultaneously.

### How to run server on the Orange pi
First, you need to have connected to the OPi via ssh.

Run the script ``` opibuild.sh {YOUR OPI NAME} {YOUR OPI IP ADDRESS} ``` 
This script will compile the program and copy it into your OPi.
Then, when in your OPi, you'll need to go to /home in your user and you must create a .env file with the following properties:
```
SESSION_KEY={SOMETHING_LONG}
PASSWORD_KEY={SOMETHING_LONG}
PORT={WHATEVER}
```

Then, run the command ``` ./actix-server ``` and it'll print the IP to be used in