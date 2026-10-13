// Public preview: no service credentials or telemetry.
export function createEnvDefines() {
 return { NODE_ENV: 'development', ENVIRONMENT: 'dev', APPID: '', GATEWAY: '', LOGINREALM: '', PRIVATE_KEY: '', RELEASE: 'preview', BASE_URL: '/', Feedback: { APPID: '', PRIVATE_KEY: '', PUBLIC_KEY: '' }, sentry: { dsn: '', tracesSampleRate: 0 }, ASE: { GATEWAY: '', INFORMATION: '', INFORMATION2: '' }, MIDDLE_PLATFORM: { GATEWAY: '' }, WEB: {}, RealNameAuthentication: { GATEWAY: '', APPID: '', privateKey: '', PUBLIC_KEY: '' } }
}
