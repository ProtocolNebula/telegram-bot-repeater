class Chat {
    
    
    constructor(ctx, chat) {
        this.id = chat.id
        this.title = chat.title
        this.type = chat.type
        this.message = null
        this.lapseseconds = null
        this.nextsend = null
        this.context = ctx
    }
    
    setMessage(msg, seconds) {
        this.message = msg
        this.lapseseconds = seconds
        this.sendMessageForced("New Message set:")
        this.sendMessage(Math.floor(Date.now()))
    }
    
    async sendMessage(curDate) {
        if (curDate > this.nextsend) {
            this.nextsend = curDate + this.lapseseconds * 1000
            await this.context.reply(this.message)
            
            //console.log("Sending..." + this.message)
        }
    }
    
    /**
     * Send a message to telegram ignoring time
     * @param {type} message Message to send
     * @returns {undefined}
     */
    async sendMessageForced(message) {
        await this.context.reply(message)
    }
}

module.exports = Chat