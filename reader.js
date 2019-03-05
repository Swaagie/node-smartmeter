'use strict';

const EventEmitter = require('events');
const SerialPort = require('serialport');
const defaults = {
  target: '/dev/ttyUSB0',
  options: {
    baudRate: 115200
  }
}

class Reader extends EventEmitter {
  constructor({ events, config = defaults, signature = /![0-9A-F]{4}/ } = {}) {
    super();

    const { target, options } = config;

    this._open = false;
    this._signature = signature;
    this._port = new SerialPort(target, {
      ...defaults,
      ...options,
      autoOpen: false
    });
  }

  open() {
    this._port.open(error => {
      if (error) {
        return this.emit('error', error);
      }

      this._open = true;
      this._port.on('data', this.concat());
    });
  }

  //
  // Concatenate all data in to a single array that can be parsed
  //
  concat(signal = []) {
    return data => {
      signal.push(data.toString('utf-8'));

      //
      // End of message, parse the concatenated signal.
      //
      if (~data.indexOf('!')) {
        this.emit('signal', signal.join(''));
        signal = [];
      }
    }
  }
}

module.exports = Reader;
