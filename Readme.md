# Telegram bot repeater

## Description
This bot repeat a text set by group admin each **X** seconds

## Configuring @BotFather
**The next configuration is only to make the bot super-efficiently (without listening non-bot messages)**
1. Create a bot with @BotFather
2. Turn OFF ```Inline mode```
3. Turn ON ```Groups```
4. Turn ON ```Privacy mode```

## How to launch
1. Create the bot with @BotFather (step above)
2. Clone the repository
3. Copy the file ```src/config/server.original.js``` to ```src/config/server.js``` and **configure-it**
4. Launch the project with ```npm start```
5. Add the bot to Group chat
6. Execute /start@BotName to view how to launch (```/start@BotName SECONDS STRING TO REPEAT```)
