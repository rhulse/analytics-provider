import {
  SET_LANGUAGE,
  PAGE_VIEW,
  EVENT,
  TIMING,
  SET_PAGE,
  SET_USER_ID,
  SET_APP_ID,
  SET_APP_NAME,
  SET_APP_VERSION,
  START_SESSION,
  END_SESSION,
} from "../types";

/**
 * This provider has been written to work with logstash HTTP input plugin
 * ref: https://www.elastic.co/blog/introducing-logstash-input-http-plugin
 *
 */

export default class LogStashProvider {
  /**
   *
   * @param {*} param0
   */
  constructor({ providerId, debug = false, loggingLevel = 0 }) {
    this.debug = debug;
    this.loggingLevel = loggingLevel;

    this.logger(0, "Initialsing logStash.");

    if (providerId) {
      this.providerID = providerId;
      this.initialise();
    } else {
      this.logger(0, "No provider ID - logging to console instead.");
    }
  }

  initialise() {}

  /**
   *
   * @param {type} action The analytics action
   * @param {object} payload The data payload
   */
  dispatch(action, ...payload) {
    switch (action) {
      case SET_LANGUAGE:
        this.setLanguage(...payload, false);
        break;

      case SET_APP_NAME:
        this.setAppName(...payload);
        break;

      case SET_APP_VERSION:
        this.setAppVersion(...payload);
        break;

      case SET_APP_ID:
        this.setAppId(...payload);
        break;

      case PAGE_VIEW:
        this.pageView(...payload);
        break;

      case SET_PAGE:
        this.setPage(...payload);
        break;

      case EVENT:
        this.event(...payload);
        break;

      case TIMING:
        this.timing(...payload);
        break;

      case SET_USER_ID:
        this.setUserId(...payload);
        break;

      case START_SESSION:
        this.session("start");
        break;

      case END_SESSION:
        this.session("end");
        break;

      default:
        break;
    }
  }

  /**
   *
   * @param  {...any} args The args for GA
   */
  _dispatchToProvider(...args) {
    // TODO: Assemble payload
  }

  /**
   *
   * @param {string} url Send a pageview for the specfied URL
   */
  pageView(url) {
    if (url) {
      this.logger(1, "[PAGEVIEW]", url);
      this._dispatchToProvider("send", "pageview", url);
    } else {
      this.logger(1, "[PAGEVIEW] [send]");
      this._dispatchToProvider("send", "pageview");
    }
  }

  /**
   *
   * @param {string} url Set the current URL.
   * NB: This does NOT register a page view. See pageView.
   */
  setPage(url) {
    this.logger(1, "[SET_PAGE]", url);

    this._dispatchToProvider("set", "page", url);
  }

  /**
   *
   * @param {string} lang The ISO language code
   */
  setLanguage(lang) {
    this.logger(1, "[LANGUAGE]", lang);

    this._dispatchToProvider("set", "language", lang);
  }

  setAppName(appName) {
    if (appName === undefined) {
      this.missingParams("setAppName", "appName");
      return;
    }
    this.logger(1, "[APP NAME]", appName);
    this._dispatchToProvider("set", "appName", appName);
  }

  setAppId(appId) {
    if (appId === undefined) {
      this.missingParams("setAppId", "appId");
      return;
    }
    this.logger(1, "[APP ID]", appId);
    this._dispatchToProvider("set", "appId", appId);
  }

  setAppVersion(appVersion) {
    if (appVersion === undefined) {
      this.missingParams("setAppVersion", "appVesion");
      return;
    }
    this.logger(1, "[APP VERSION]", appVersion);
    this._dispatchToProvider("set", "appVersion", appVersion);
  }

  event(eventData) {
    this.logger(1, "[EVENT]", eventData);

    this._dispatchToProvider("send", "event", eventData);
  }

  timing(timingData) {
    this.logger(1, "[TIMING]", timingData);

    this._dispatchToProvider("send", "timing", timingData);
  }

  setUserId(userId) {
    this.logger(1, "[USER ID]", userId);

    this._dispatchToProvider("set", "userId", userId);
  }

  session(state) {
    this.logger(1, "[SESSION]", state);
    this._dispatchToProvider("send", "pageview", { sessionControl: state });
  }

  /**
   * @returns The URL to be used for analytics, based on debug (or not)
   */
  getScriptURL() {
    if (this.debug) {
      return "https://www.google-analytics.com/analytics_debug.js";
    }

    return "https://www.google-analytics.com/analytics.js";
  }

  /**
   *
   * @param {number} level The logging level
   * @param  {...any} params Items to display in the console.log
   */
  logger(level, ...params) {
    if (this.loggingLevel > level) {
      console.log("[LS]", ...params);
    }
  }

  missingParams(functionName, ...args) {
    console.warn("[LS]", `function ${functionName}() is missing: ${args}`);
  }
}
