import ElicastService from '@/elicast/elicast-service'

/**
 *  Logger
 */
export default class Logger {
  constructor (name) {
    this.name = name
    this.ticket = null
    this.initToken()
  }

  async initToken () {
    const ticket = await ElicastService.getLogTicket(this.name)
    await ElicastService.submitLog(ticket, {
      'action': 'get-ticket'
    })
    this.ticket = ticket
  }

  async submit (action, args) {
    if (this.ticket === null) return
    await ElicastService.submitLog(this.ticket, {
      'action': action,
      ...args
    })
  }
}
