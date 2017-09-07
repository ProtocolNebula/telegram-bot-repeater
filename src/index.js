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

/**
 * Check if the current user is admin
 * @param {type} ctx
 * @returns {Promise}
 */
function isAdmin(ctx) {
    return new Promise(function(resolve, reject) {
        ctx.getChat().then(function(chat) {

            // Check if all users are admin
            if (chat.all_members_are_administrators) {
                resolve()
                return
            }

            // Check if user is admin
            ctx.getChatAdministrators().then(function(admins) {
                const currentUser = ctx.update.message.from.id

                for (let key in admins) {
                    if (admins[key].user.id == currentUser) {
                        resolve()
                        return
                    }
                }
                
                reject()
            })

        })
    })
    
}

app.use(commandParts());
app.use((ctx, next) => {
    try {
        if (ctx) {
            isAdmin(ctx).then((res) => {
                console.log(ctx.contextState)
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
            }).catch((error) => {
                ctx.reply("Only admins can set the message")
            })
            
            
        } 
    } catch (ex) {
        console.log(ex)
    }
    
    return next()
});
  
app.command('start', (ctx) => {
    ctx.reply('Add this bot to your group and make a repeat string with:\n' +
    '/set@'+app.options.username+' SECONDS MESSAGE TO SEND\n\n'+
    'EXAMPLE:\n'+
    '/'+app.options.username+' 30 You must remember who\'s the admin\n\n'+
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
        const message = command.splitArgs.slice(1).join(' ')
        
        if (seconds < config.MIN_SECONDS_BETWEEN_SENDS - 1) {
            ctx.reply('The minimum time between message is ' + config.MIN_SECONDS_BETWEEN_SENDS + ' seconds')
        } else if (message == '') {
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
    } catch (ex) {
        console.log('Error adding message ' , ex)
    }
}

app.startPolling()

setInterval(function() {
    const currentTime = Math.floor(Date.now())
    for (let chat in ActiveChats) {
        console.log("Enviando a " + chat)
        try {
            ActiveChats[chat].sendMessage(currentTime)   
        }
        catch (exception) {
            console.log(exception)
        }
    }
}, config.SECONDS_CYCLE * 1000)