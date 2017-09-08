import ElicastService from '@/elicast/elicast-service'

class Logger {
  constructor () {
    this.ticket = null
    this.initTicket()
  }

  getLogger (name) {
    return {
      submit: (action, args) => this.submit(name, action, args)
    }
  }

  async initTicket () {
    const ticket = await ElicastService.getLogTicket('')
    await ElicastService.submitLog(ticket, {
      'action': 'get-ticket'
    })
    this.ticket = ticket
  }

  async submit (name, action, args) {
    if (this.ticket === null) return

    await ElicastService.submitLog(this.ticket, {
      'name': name,
      'action': action,
      ...args
    })
  }
}

export default {
  install (Vue, options) {
    const $logger = new Logger()

    Object.defineProperty(Vue.prototype, '$logger', {
      get: () => $logger
    })
  }
}
