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

/**
 * Parse the commands and check admin permissions
 */
app.use((ctx, next) => {
    try {
        if (ctx) {
            isAdmin(ctx).then((res) => {
                if ('command' in ctx.contextState) {
                    switch (ctx.contextState.command.command) {
                        case "stop":
                            stop(ctx)
                            break;
                        case "set":
                            setMessage(ctx)
                            break;
                        default:
                            return next()
                    }
                }
            }).catch((error) => {
                ctx.reply("Only admins can use the bot")
            })
        } else {
            return next()
        }
    } catch (ex) {
        console.log('Parsing commands: ' + ex)
        return
    }
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

async function executeInterval() {
    const currentTime = Math.floor(Date.now())
    for (let chat in ActiveChats) {
        //console.log("Checking sending to " + chat)
        try {
            await ActiveChats[chat].sendMessage(currentTime)   
        }
        catch (exception) {
            //console.log(exception)
            switch (exception.response.error_code) {
                case 403:
                    // Bot kicked
                    delete ActiveChats[chat]
                    console.log('Bot was kicked from chat ' + chat)
                    break;
            }
        }
    }
}

process.on('unhandledRejection', error => {
    // TODO: Make code compatible to not  launch this code when bot is kicked or something
  console.log('unhandledRejection', error.message);
});

setInterval(executeInterval, config.SECONDS_CYCLE * 1000)