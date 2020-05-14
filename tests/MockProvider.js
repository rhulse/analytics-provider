export default class MockProvider {
  constructor({ providerId, debug = false, loggingLevel = 0 }) {
    this.debug = debug;
    this.loggingLevel = loggingLevel;

    this.logger(0, "Initialsing GA Analytics.");

    if (providerId) {
      this.providerID = providerId;
      this.initialise();
    } else {
      this.logger(0, "No provider ID - logging to console instead.");
    }
  }

  initialise(
    providerID,
    defaultLanguage,
    applicationName,
    applicationVersion
  ) {}

  dispatch(event) {
    return event;
  }
}
