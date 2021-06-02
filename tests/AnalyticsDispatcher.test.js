/**
 * @jest-environment jsdom
 */

import AnalyticsDispatcher from "../src/AnalyticsDispatcher";
import Provider from "./MockProvider";
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
} from "../src/types";

jest.mock("./MockProvider");

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

beforeEach(() => {
  // Clear all instances and calls to constructor and all methods:
  Provider.mockClear();
  // supress logging
  // jest.spyOn(console, "log").mockImplementation(() => {});
});

describe("initialize", () => {
  beforeEach(() => {
    // GA assumes there is an existing script element in the document
    const script = document.createElement("script");
    document.body.appendChild(script);
  });

  it("Should create the dispatcher", () => {
    const dispatcher = new AnalyticsDispatcher({
      providers: [new Provider("ID")],
    });

    expect(dispatcher.currentPageURL).toBe(null);
  });
});

describe("dispatch", () => {
  let dispatcher;
  let spy;

  beforeEach(() => {
    dispatcher = new AnalyticsDispatcher({
      providers: [new Provider("ID")],
    });

    spy = jest.spyOn(dispatcher, "dispatch").mockImplementation(() => {});
  });

  it("Should set the language", () => {
    dispatcher.setLanguage("fr");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(SET_LANGUAGE, "fr");
  });

  it("Should change the language", () => {
    dispatcher.changeLanguage("fr");

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, SET_LANGUAGE, "fr");
    expect(spy).toHaveBeenNthCalledWith(2, EVENT, {
      eventAction: "Change",
      eventCategory: "Language",
      eventLabel: "fr",
    });
  });

  it("Should dispatch an event", () => {
    dispatcher.event({ thing: "thing", this: "this", that: "that" });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(EVENT, {
      that: "that",
      thing: "thing",
      this: "this",
    });
  });

  it("Should set the page url", () => {
    dispatcher.setPage("/quantum");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(SET_PAGE, "/quantum");
  });

  it("Should dispatch a page view", () => {
    dispatcher.pageView("/quantum");

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, SET_PAGE, "/quantum");
    expect(spy).toHaveBeenNthCalledWith(2, PAGE_VIEW);
  });

  it("Should dispatch timing data", () => {
    dispatcher.timing({ thing: "thing", this: "this", that: "that" });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(TIMING, {
      that: "that",
      thing: "thing",
      this: "this",
    });
  });

  it("Should set the app name", () => {
    dispatcher.setAppName("Bertie");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(SET_APP_NAME, "Bertie");
  });

  it("Should set the app ID", () => {
    dispatcher.setAppId("Elizabeth");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(SET_APP_ID, "Elizabeth");
  });

  it("Should set the app version", () => {
    dispatcher.setAppVersion("3.1415926");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(SET_APP_VERSION, "3.1415926");
  });

  it("Should set the user ID", () => {
    dispatcher.setUserId("George");

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(SET_USER_ID, "George");
  });

  it("Should start and end a session", () => {
    dispatcher.startSession();
    dispatcher.endSession();

    // expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, START_SESSION);
    expect(spy).toHaveBeenNthCalledWith(2, END_SESSION);
  });
});

describe("dispatch - kiosk options", () => {
  let dispatcher;
  let spy;

  describe("no tracking of time", () => {
    beforeEach(() => {
      dispatcher = new AnalyticsDispatcher({
        providers: [new Provider("ID")],
      });
      spy = jest.spyOn(dispatcher, "dispatch").mockImplementation(() => {});
    });

    it("Should send any timing", () => {
      dispatcher.pageView("/feynman");
      sleep(15);
      dispatcher.pageView("/tesla");

      expect(spy).toHaveBeenCalledTimes(4);

      expect(spy).toHaveBeenNthCalledWith(1, SET_PAGE, "/feynman");
      expect(spy).toHaveBeenNthCalledWith(2, PAGE_VIEW);
      expect(spy).toHaveBeenNthCalledWith(3, SET_PAGE, "/tesla");
      expect(spy).toHaveBeenNthCalledWith(4, PAGE_VIEW);
    });
  });

  describe("trackPageTime = true", () => {
    beforeEach(() => {
      dispatcher = new AnalyticsDispatcher({
        providers: [new Provider("ID")],
        trackPageTime: true,
      });
      spy = jest.spyOn(dispatcher, "dispatch").mockImplementation(() => {});
    });

    it("Should send page timing", () => {
      dispatcher.pageView("/feynman");
      sleep(15);
      dispatcher.pageView("/tesla");

      expect(spy).toHaveBeenCalledTimes(5);

      expect(spy).toHaveBeenNthCalledWith(1, SET_PAGE, "/feynman");
      expect(spy).toHaveBeenNthCalledWith(2, PAGE_VIEW);
      expect(spy).toHaveBeenNthCalledWith(3, TIMING, {
        timingCategory: "Page View",
        timingValue: expect.any(Number),
        timingVar: "Length",
        timingLabel: "/feynman",
      });
      expect(spy).toHaveBeenNthCalledWith(4, SET_PAGE, "/tesla");
      expect(spy).toHaveBeenNthCalledWith(5, PAGE_VIEW);
    });
  });

  describe("trackSessionTime = true", () => {
    beforeEach(() => {
      dispatcher = new AnalyticsDispatcher({
        providers: [new Provider("ID")],
        trackSessionTime: true,
      });
      spy = jest.spyOn(dispatcher, "dispatch").mockImplementation(() => {});
    });

    it("Should track session time", () => {
      dispatcher.pageView("/feynman");
      sleep(15);
      dispatcher.pageView("/tesla");
      dispatcher.endSession();

      expect(spy).toHaveBeenCalledTimes(7);

      expect(spy).toHaveBeenNthCalledWith(1, START_SESSION);
      expect(spy).toHaveBeenNthCalledWith(2, SET_PAGE, "/feynman");
      expect(spy).toHaveBeenNthCalledWith(3, PAGE_VIEW);
      expect(spy).toHaveBeenNthCalledWith(4, SET_PAGE, "/tesla");
      expect(spy).toHaveBeenNthCalledWith(5, PAGE_VIEW);
      expect(spy).toHaveBeenNthCalledWith(6, TIMING, {
        timingCategory: "Session",
        timingValue: expect.any(Number),
        timingVar: "Length",
      });
      expect(spy).toHaveBeenNthCalledWith(7, END_SESSION);
    });
  });

  describe("Page and Session timing", () => {
    beforeEach(() => {
      dispatcher = new AnalyticsDispatcher({
        providers: [new Provider("ID")],
        trackPageTime: true,
        trackSessionTime: true,
      });
      spy = jest.spyOn(dispatcher, "dispatch").mockImplementation(() => {});
    });

    it("Should track page and session time", () => {
      dispatcher.pageView("/feynman");
      sleep(15);
      dispatcher.pageView("/tesla");
      dispatcher.endSession();

      expect(spy).toHaveBeenCalledTimes(8);

      expect(spy).toHaveBeenNthCalledWith(1, START_SESSION);
      expect(spy).toHaveBeenNthCalledWith(2, SET_PAGE, "/feynman");
      expect(spy).toHaveBeenNthCalledWith(3, PAGE_VIEW);
      expect(spy).toHaveBeenNthCalledWith(4, TIMING, {
        timingCategory: "Page View",
        timingValue: expect.any(Number),
        timingVar: "Length",
        timingLabel: "/feynman",
      });
      expect(spy).toHaveBeenNthCalledWith(5, SET_PAGE, "/tesla");
      expect(spy).toHaveBeenNthCalledWith(6, PAGE_VIEW);
      expect(spy).toHaveBeenNthCalledWith(7, TIMING, {
        timingCategory: "Session",
        timingValue: expect.any(Number),
        timingVar: "Length",
      });
      expect(spy).toHaveBeenNthCalledWith(8, END_SESSION);
    });
  });

  describe("All kiosk options", () => {
    beforeEach(() => {
      dispatcher = new AnalyticsDispatcher({
        providers: [new Provider("ID")],
        trackPageTime: true,
        trackSessionTime: true,
        kioskHomePage: "/",
      });
      spy = jest.spyOn(dispatcher, "dispatch").mockImplementation(() => {});
    });

    it("Should track page, session time, and reset to home", () => {
      dispatcher.pageView("/feynman");
      sleep(15);
      dispatcher.pageView("/tesla");
      dispatcher.endSession();

      expect(spy).toHaveBeenCalledTimes(10);

      expect(spy).toHaveBeenNthCalledWith(1, START_SESSION);
      expect(spy).toHaveBeenNthCalledWith(2, SET_PAGE, "/feynman");
      expect(spy).toHaveBeenNthCalledWith(3, PAGE_VIEW);
      expect(spy).toHaveBeenNthCalledWith(4, TIMING, {
        timingCategory: "Page View",
        timingValue: expect.any(Number),
        timingVar: "Length",
        timingLabel: "/feynman",
      });
      expect(spy).toHaveBeenNthCalledWith(5, SET_PAGE, "/tesla");
      expect(spy).toHaveBeenNthCalledWith(6, PAGE_VIEW);
      expect(spy).toHaveBeenNthCalledWith(7, TIMING, {
        timingCategory: "Session",
        timingValue: expect.any(Number),
        timingVar: "Length",
      });
      expect(spy).toHaveBeenNthCalledWith(8, SET_PAGE, "/session-end");

      expect(spy).toHaveBeenNthCalledWith(9, END_SESSION);
      expect(spy).toHaveBeenNthCalledWith(10, SET_PAGE, "/");
    });
  });
});
