const Sentry = require('@sentry/node');
const { CaptureConsole } = require('@sentry/integrations');

const initSentry = () => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || "https://a677ac1bab69e975fdfe1053f9690ee8@o4509351226507264.ingest.us.sentry.io/4509351229063168",
      integrations: [
        new CaptureConsole({
          levels: ['error']
        })
      ],
      tracesSampleRate: 0.2,
      environment: process.env.NODE_ENV,
      sendDefaultPii: true  // Permite enviar informações de identificação pessoal (IP, etc)
    });
  }
};

module.exports = initSentry;
