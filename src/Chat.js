class Chat {
    
    
    constructor() {
        this.id = null
        this.message = null
        this.lapseseconds = null
        this.nextsend = null
        this.context = null
    }
    
    setMessage(msg, seconds) {
        this.message = msg
        this.lapseseconds = seconds
        this.sendMessage(Math.floor(Date.now()))
    }
    
    sendMessage(curDate) {
        if (curDate > this.nextsend) {
            this.nextsend = curDate + this.lapseseconds * 1000
            this.context.reply(this.message)
            
            //console.log("Sending..." + this.message)
        }
    }
}

module.exports = Chat