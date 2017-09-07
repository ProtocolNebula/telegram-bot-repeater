const Telegraf = require('telegraf')
const config = require('./config/server.js')
const Chat = require('./Chat.js')
const commandParts = require('telegraf-command-parts');

const app = new Telegraf(config.TELEGRAM_TOKEN)

var ActiveChats = [];

app.telegram.getMe().then((botInfo) => {
  app.options.username = botInfo.username
  
  console.log("Bot username: @" + botInfo.username)
})

app.use(commandParts());
app.use((ctx, next) => {
    console.log(ctx.update.message.from);
    if (ctx.update.message.from.id != "13061540") {
        return;
    }
    console.log(ctx.update.message.from)
    console.log(ctx.update.message.chat)
    if ('command' in ctx.contextState) {
        switch (ctx.contextState.command.command) {
            case "stop":
                stop(ctx)
                break;
            case "set":
                setMessage(ctx)
                break;
        }
    }
    //console.log(ctx)
    
    return next()
});
  
app.command('start', (ctx) => {
    ctx.reply('Add this bot to your group and make a repeat string with:\n' +
    '/set@GroupRepeatBot SECONDS MESSAGE TO SEND\n\n'+
    'EXAMPLE:\n'+
    '/set@GroupRepeatBot 30 You must remember who\'s the admin\n\n'+
    'If you need to stop send:\n'+
    '/stop@GroupRepeatBot'
    )
    
    return true;
})

function stop(ctx) {
    try {
        const chat = ctx.update.message.chat
        delete ActiveChats[chat.id]
        console.log("Message stopped from chat ", chat.id)
        
    } catch (ex) {
        console.log(ex)
    }
}

function setMessage(ctx) {
    try {
        const command = ctx.contextState.command
        const seconds = command.splitArgs[0]
        delete command.splitArgs[0]
        const message = command.splitArgs.slice(1).join(" ")
        
        if (seconds < config.MIN_SECONDS_BETWEEN_SENDS - 1) {
            ctx.reply('The minium time between message is ' + config.MIN_SECONDS_BETWEEN_SENDS + ' seconds')
        } else if (message == "") {
            ctx.reply('You must specify a message')
        } else {
            ctx.getChat().then((info) => {
                const currentId = info.id
                const chat = new Chat()
                chat.id = currentId
                chat.context = ctx
                chat.setMessage(message, seconds)

                ActiveChats[currentId] = chat

                console.log("New message added: " ,message)
            })
            
        }
        
        //console.log(command.splitArgs[0])
        //if (command.splitArgs[1])
        //console.log(command)

        
        
    } catch (ex) {
        console.log('Error adding message ' , ex)
    }
}

app.startPolling()

setInterval(function() {
    const currentTime = Math.floor(Date.now())
    try {
        for (let chat in ActiveChats) {
            //console.log(chat)
            ActiveChats[chat].sendMessage(currentTime)
        }
        
    } catch (ex) {
        console.log(ex)
    }
}, config.SECONDS_CYCLE)