const jsxapi = require('jsxapi');
const log = require('simple-node-logger').createSimpleLogger();
const request = require('request');

const config = require('./config');

log.setLevel = process.env.LOG_LEVEL || 'info';

function setLight(entity_id, brightness) {
  const state = brightness > 0 ? 'turn_on' : 'turn_off';
  const payload = brightness > 0
    ? { entity_id, brightness }
    : { entity_id };

  request({
    url: `${config.hass_url}/api/services/light/${state}`,
    method: 'POST',
    json: true,
    body: payload
  }, (err, res) => {
    if (err) {
      log.error(err);
    }
  });
}

function setup () {
  log.info(`connecting to ${config.url}`);
  const xapi = jsxapi.connect(config.url, config.options);

  let reconnect = () => {
    // make sure it's lonely in here...
    reconnect = () => {};

    const wait = config.reconnect || 10;
    log.info(`reconnecting in ${wait} seconds`);

    setTimeout(() => setup(), wait * 1000);
  };

  xapi
    .on('ready', () => { log.info('connected'); })
    .on('close', () => {
      reconnect();
    })
    .on('error', (error) => {
      log.error(error);
      reconnect();
    })

  xapi.event.on('UserInterface Extensions Widget Action', (data) => {
    const prefix = 'light:';
    if (!data.WidgetId.startsWith(prefix) || data.Type !== 'released') {
        return;
    }

    const entity = data.WidgetId.replace(new RegExp(`^${prefix}`), 'light.');
    const brightness = data.Value;

    setLight(entity, brightness);    
  });
}

setup();
