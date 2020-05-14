import {
  SET_LANGUAGE,
  PAGE_VIEW,
  EVENT,
  TIMING,
  SET_PAGE,
  SET_APP_VERSION,
  SET_APP_NAME,
  SET_APP_ID,
  SET_USER_ID,
  START_SESSION,
  END_SESSION,
} from "./types";

import timeTracker from "./trackers/TimeTracker";
import SessionTracker from "./trackers/SessionTracker";

export default class AnalyticsDispatcher {
  /**
   * @constructor
   * @param {Array}   providers An array of provider objects
   * @param {number}  loggingLevel the level of console logging.
   * @param {boolean} trackPageTime tracks the length of time spent on each page (apart from the last page in a session).
   * @param {boolean} trackSessionTime tracks the length of session using the beforeunload event.
   * @param {string}  kioskHomePage
   * @param {number}  idleTimeout time in mS before the app's screensaver kicks in. Use in estimating session timing.
   * @param {boolean} adjustSessionTimingForTimeout estimate the length of the session based on when the screensaver kicks in and an average of pageView times.
   *
   */
  constructor({
    providers,
    loggingLevel = 0,
    trackPageTime = false,
    trackSessionTime = false,
    adjustSessionTimingForTimeout = false,
    kioskHomePage = null,
    idleTimeout = 0,
  }) {
    this.dispatch = (...args) => {
      providers.forEach((provider) => provider.dispatch(...args));
    };

    this.timeOnCurrentPage = null;
    this.currentPageURL = null;

    this.loggingLevel = loggingLevel;

    this.trackPageTime = trackPageTime;
    this.trackSessionTime = trackSessionTime;
    this.kioskHomePage = kioskHomePage;

    this.timeTracker = timeTracker;

    this.session = new SessionTracker(
      timeTracker,
      idleTimeout,
      adjustSessionTimingForTimeout,
      loggingLevel
    );

    // if (trackSessionTime === true) {
    //   window.addEventListener("beforeunload", (ev) => {
    //     ev.preventDefault();

    //     this.endSession();

    //     // Chrome requires returnValue to be set.
    //     // eslint-disable-next-line no-param-reassign
    //     ev.returnValue = "";
    //   });
    // }
    if (this.kioskHomePage) {
      this.setPage(kioskHomePage);
    }
  }

  /**
   *
   * @param {string} language The ISO 639-1 language code
   */
  setLanguage(language) {
    if (this.trackSessionTime) this.startSession({ wasEvent: true });

    this.logger(1, "[SET_LANGUAGE]", language);
    this.dispatch(SET_LANGUAGE, language);
  }

  /**
   *
   * @param {string} language The ISO 639-1 language code
   */
  changeLanguage(language) {
    if (this.trackSessionTime) this.startSession({ wasEvent: true });

    this.dispatch(SET_LANGUAGE, language);
    this.event({
      eventCategory: "Language",
      eventAction: "Change",
      eventLabel: language,
    });
  }

  event(eventData) {
    if (this.trackSessionTime) this.startSession({ wasEvent: true });

    this.logger(1, "[EVENT]", eventData);
    this.dispatch(EVENT, eventData);
  }

  /**
   *
   * @param {string} url The URL of the page
   */
  setPage(url) {
    this.currentPageURL = url;

    this.logger(1, "[SET_PAGE]", url);
    this.dispatch(SET_PAGE, url);
  }

  /**
   *
   * @param {string} url The URL of the page
   */
  pageView(url) {
    if (this.trackSessionTime) this.startSession();

    this._logCurrentPageTime();

    this.currentPageURL = url;

    // we set the page first and then send it as this approach is required for single page apps.
    // it ensures that the tracker always knows what page any OTHER events are assocaited with.
    // ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/single-page-applications
    this.setPage(url);

    this.logger(1, "[PAGEVIEW] [send]");
    this.dispatch(PAGE_VIEW);
  }

  _logCurrentPageTime() {
    if (this.trackPageTime) {
      // This is always logging the duration of the PREVIOUS page view, not the one just set.
      this.timeOnCurrentPage = this.timeTracker.restartTimer("pageView");

      if (this.timeOnCurrentPage) {
        this.timing({
          timingCategory: "Page View",
          timingVar: "Length",
          timingValue: this.timeOnCurrentPage,
          timingLabel: this.currentPageURL,
        });
      }
    }
  }

  timing(timingData) {
    this.logger(1, "[TIMING]", timingData);
    this.dispatch(TIMING, timingData);
  }

  startTimeTracker(name) {
    // guard against use of reserved timer name
    if (name === "pageView") {
      return;
    }
    this.timeTracker.startTimer(name);
  }

  stopTimeTracker(name, timingCategory = "Misc") {
    const elapsed = this.timeTracker.startTimer(name);

    this.timing({
      // eslint-disable-next-line object-shorthand
      timingCategory: timingCategory,
      timingVar: "Length",
      timingValue: elapsed,
      timingLabel: name,
    });
  }

  /**
   *
   * @param {string} appVersion The version number of the application
   */
  setAppVersion(appVersion) {
    this.dispatch(SET_APP_VERSION, appVersion);
  }

  /**
   *
   * @param {string} appName The name of the application
   */
  setAppName(appName) {
    this.logger(1, "[SET_APP_NAME]", appName);
    this.dispatch(SET_APP_NAME, appName);
  }

  /**
   *
   * @param {string} appId The ID of the application
   */
  setAppId(appId) {
    this.logger(1, "[SET_APP_ID]", appId);
    this.dispatch(SET_APP_ID, appId);
  }

  /**
   *
   * @param {string} userId An identifier for the current user of the application
   */
  setUserId(userId) {
    this.logger(1, "[SET_USER_ID]", userId);
    this.dispatch(SET_USER_ID, userId);
  }

  startSession(args) {
    const { wasEvent } = args || false;

    if (this.session.running) {
      return;
    }
    this.session.start();

    // start the page timer if the first action was an event
    if (this.trackPageTime && wasEvent) {
      this.timeTracker.startTimer("pageView");
    }

    this.logger(1, "[SESSION] [start]");
    this.dispatch(START_SESSION);
  }

  // change idleResetURL to use kisok start page as they should be the same
  endSession() {
    if (!this.session.running) {
      return;
    }

    if (this.trackSessionTime) {
      const durationOfSession = this.session.end();

      if (durationOfSession) {
        this.timing({
          timingCategory: "Session",
          timingVar: "Length",
          timingValue: durationOfSession,
        });
      }
    }

    // if a reset is called for the set a fake page so as not to
    // skew real page views (end session hits the currently set page)
    if (this.kioskHomePage) {
      this.setPage("/session-end");
    }

    // stop all timing
    this.timeTracker.reset();

    this.logger(1, "[SESSION] [end]");
    this.dispatch(END_SESSION);

    // restore original page state after fake session page
    if (this.kioskHomePage) {
      this.setPage(this.kioskHomePage);
    }
  }

  raw(args) {
    return this.dispatch(args);
  }

  /**
   *
   * @param {number} level The logging level
   * @param  {...any} params Items to display in the console.log
   */
  logger(level, ...params) {
    if (this.loggingLevel > level) {
      console.log("[AD]", ...params);
    }
  }
}
