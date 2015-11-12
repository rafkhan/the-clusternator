'use strict';

var rewire = require('rewire'),
  mockSpawn = require('mock-spawn');

var gpg = rewire('../../src/gpg'),
  C = require('./chai');

/*global describe, it, expect, beforeEach, afterEach */
/*eslint no-unused-expressions:0*/
describe('Test GPG CLI Wrapper', () => {
  beforeEach(() => {
    gpg.__set__('spawn', mockSpawn());
  });

  afterEach(() => {
    gpg.__set__('spawn', require('child_process').spawn);
  });

  it('escape should escape spaces', () => {
    expect(gpg.escape('bo oya')).to.equal('"bo\\ oya"');
  });

  it('escape should escape dollar signs', () => {
    expect(gpg.escape('bo$oya')).to.equal('"bo\\$oya"');
  });

  it('encrypt should reject if passphrase is shorter than thirty chars', (done) => {
    gpg.encrypt('12345678901234567890123456789', 'some text').
    then(C.getFail(done), (err) => {
      C.check(done, () => {
        expect(err instanceof Error).to.be.true;
      });
    });
  });


  describe('Test GPG CLI Passing (not stdout)', () => {
    beforeEach(() => {
      var ms = mockSpawn();
      ms.setDefault( ms.simple(0, '') );
      gpg.__set__('spawn', ms);
    });

    it('encryptFile should resolve if the spawned command resolves', (done) => {
      gpg.encryptFile('some-super-secret-and-long-pass', 'filePath').
      then(() => {
        C.check(done, () => {
          expect(true).to.be.ok;
        });
      }, C.getFail(done));
    });

    it('decryptFile should resolve if the spawned command resolves', (done) => {
      gpg.decryptFile('some-super-secret-and-long-pass', 'cipherPath', 'out').
      then(() => {
        C.check(done, () => {
          expect(true).to.be.ok;
        });
      }, C.getFail(done));
    });
  });

  describe('TestGPG CLI Passing (with stdout)', () => {

    beforeEach(() => {
      var ms = mockSpawn();
      ms.setDefault( ms.simple(0, 'output text') );
      gpg.__set__('spawn', ms);
    });

    it('encrypt should resolve with stdout data if the spawned command ' +
      'resolves', (done) => {
        gpg.encrypt('some-super-secret-and-long-pass', 'secret').then((o) => {
          C.check(done, () => {
            expect(o).to.equal('output text');
          });
        }, C.getFail(done));
      });

    it('decrypt should resolve with stdout data if the spawned command ' +
      'resolves', (done) => {
        gpg.decrypt('some-super-secret-and-long-pass', 'cipher').then((o) => {
          C.check(done, () => {
            expect(o).to.equal('output text');
          });
        }, C.getFail(done));
      });
  });
});
