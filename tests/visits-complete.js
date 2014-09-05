var controller = require('../controllers/visits-completed'),
    db = require('../db'),
    config = require('../config'),
    sinon = require('sinon');

exports.setUp = function(callback) {
  sinon.stub(config, 'get').returns({});
  callback();
};

exports.tearDown = function (callback) {
  if (db.fti.restore) {
    db.fti.restore();
  }
  if (db.getView.restore) {
    db.getView.restore();
  }
  if (config.get.restore) {
    config.get.restore();
  }
  callback();
};

exports['get returns errors from getView'] = function(test) {
  test.expect(2);
  var getView = sinon.stub(db, 'getView').callsArgWith(2, 'bang');
  controller.get({}, function(err, results) {
    test.equals(err, 'bang');
    test.equals(getView.callCount, 1);
    test.done();
  });
};

exports['get returns errors from fti'] = function(test) {
  test.expect(3);
  var getView = sinon.stub(db, 'getView').callsArgWith(2, null, {
    rows: [
      { key: [ null, '1' ], value: 1 }
    ]
  });
  var fti = sinon.stub(db, 'fti').callsArgWith(2, 'boom');
  controller.get({}, function(err, results) {
    test.equals(err, 'boom');
    test.equals(getView.callCount, 1);
    test.equals(fti.callCount, 1);
    test.done();
  });
};

exports['get returns zero for all counts when no visits'] = function(test) {
  test.expect(2);
  var getView = sinon.stub(db, 'getView').callsArgWith(2, null, {
    rows: []
  });
  controller.get({}, function(err, results) {
    test.same(results, [0, 0, 0, 0]);
    test.equals(getView.callCount, 1);
    test.done();
  });
};

exports['get returns zero for all counts when no preganacies are complete'] = function(test) {
  test.expect(3);
  var getView = sinon.stub(db, 'getView').callsArgWith(2, null, {
    rows: [
      { key: [ null, '1' ], value: 1 },
      { key: [ null, '2' ], value: 3 }
    ]
  });
  var fti = sinon.stub(db, 'fti');
  fti.onFirstCall().callsArgWith(2, null, {
    rows: [
      { doc: { patient_id: '3' } },
      { doc: { patient_id: '4' } }
    ]
  });
  fti.onSecondCall().callsArgWith(2, null, {
    rows: [
      { doc: { patient_id: '5' } }
    ]
  });
  controller.get({}, function(err, results) {
    test.same(results, [0, 0, 0, 0]);
    test.equals(getView.callCount, 1);
    test.equals(fti.callCount, 2);
    test.done();
  });
};

exports['get returns counts when complete preganacies have visits'] = function(test) {
  test.expect(3);
  var getView = sinon.stub(db, 'getView').callsArgWith(2, null, {
    rows: [
      { key: [ null, '1' ], value: 1 },
      { key: [ null, '2' ], value: 3 },
      { key: [ null, '3' ], value: 10 }
    ]
  });
  var fti = sinon.stub(db, 'fti');
  fti.onFirstCall().callsArgWith(2, null, {
    rows: [
      { doc: { patient_id: '1' } },
      { doc: { patient_id: '3' } }
    ]
  });
  fti.onSecondCall().callsArgWith(2, null, {
    rows: [
      { doc: { patient_id: '2' } }
    ]
  });
  controller.get({}, function(err, results) {
    test.same(results, [3, 2, 2, 1]);
    test.equals(getView.callCount, 1);
    test.equals(fti.callCount, 2);
    test.done();
  });
};
