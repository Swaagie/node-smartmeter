const { describe, it } = require('mocha');
const EventEmitter = require('events');
const Reader = require('./reader.js');
const Parser = require('./parser.js');
const assume = require('assume');
const sinon = require('sinon');

describe('Reader', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('exposes a class', function () {
    assume(Reader).to.be.a('function');
    assume(new Reader).to.be.instanceof(Reader);
  });

  describe('.open', function () {
    it('will attempt to open and read from serial port', function (done) {
      const reader = new Reader;

      reader.once('error', function (error) {
        assume(error.message).to.include('No such file or directory, cannot open /dev/ttyUSB0');
        done();
      });

      reader.open();
    });

    it('will store concat data until data contains !', function (done) {
      const reader = new Reader;

      sinon.stub(reader._port, 'open').callsArg(0);

      reader.once('signal', function (data) {
        assume(data).to.equal('testend!');

        done();
      });

      reader.open();

      assume(reader._open).to.be.true();

      reader._port.emit('data', Buffer.from('test'));
      reader._port.emit('data', Buffer.from('end!'));
    });
  });
});

describe('Parser', function () {
  it('exposes a class', function () {
    assume(Parser).to.be.a('function');
    assume(new Parser).to.be.instanceof(Parser);
  });

  describe('.extract', function () {
    it('returns early for undefined indices', function () {
      assume(new Parser().extract(['first (1kb)'], 2)).to.equal(undefined);
    });

    it('can extract numerical units from data', function () {
      const parser = new Parser;

      assume(parser.extract(['random (42.0kb)'], 0)).to.equal(42.0);
      assume(parser.extract([null, null, 'entity here (120KJ/s)'], 2)).to.equal(120);
    });
  });

  describe('.parse', function () {
    it('can parse complex multiline strings to smart meter values', function (done) {
      const parser = new Parser;

      parser.once('parsed', function (t, data) {
        assume(t.toString()).to.include(Date.now().toString().substr(0, 8));

        assume(data).to.have.property('lowTariffReceived', 500.2);
        assume(data).to.have.property('highTariffReceived', 123.9);
        assume(data).to.have.property('lowTariffDelivered', undefined);

        done();
      });

      parser.parse('0-1:\r\n0-2:\r\n0-3:\r\n1-1:multiple values like (500.2Kwh) \r\n 1-2:Or high (123.9Kwh)')
    });
  });
});
