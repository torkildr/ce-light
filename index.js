const jsxapi = require('jsxapi');
const log = require('simple-node-logger').createSimpleLogger();

const config = require('./config');

log.setLevel = process.env.LOG_LEVEL || 'info';

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
    if (!data.WidgetId.startsWith('hass:') || data.Type !== 'released') {
        return;
    }
    log.info(JSON.stringify(data, null, 2));
  });
}

setup();
