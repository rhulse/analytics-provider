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

import GoogleGa from "../src/providers/GoogleGA";

function GACommandQueue() {
  const q = (window.ga && window.ga.q) || [];
  return q.map((args) => [].slice.call(args));
}

describe("Google Analytics Provider", () => {
  let provider;

  beforeAll(() => {
    // supress logging
    // jest.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("initialisation", () => {
    beforeEach(() => {
      // GA assumes there is an existing script element in the document
      const script = document.createElement("script");
      document.body.appendChild(script);
    });

    it("should not create window.ga", () => {
      provider = new GoogleGa({ providerId: "" });
      expect(window.ga).toEqual(undefined);
    });

    it("should create window.ga", () => {
      provider = new GoogleGa({ providerId: "UA-XXXXX-X" });
      expect(window.ga).toEqual(expect.any(Function));
    });

    it("should initialize analytics in production mode", () => {
      const spy = jest.spyOn(document, "createElement");
      const script = document.createElement("script");
      script.src = "https://www.google-analytics.com/analytics.js";

      provider = new GoogleGa({ providerId: "UA-XXXXX-X" });

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveReturnedWith(script);

      spy.mockRestore();
    });

    it("should initialize analytics in debug mode", () => {
      const script = document.createElement("script");
      script.src = "https://www.google-analytics.com/analytics_debug.js";

      const spy = jest.spyOn(document, "createElement");
      provider = new GoogleGa({ providerId: "PID", debug: true });

      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveReturnedWith(script);

      spy.mockRestore();
    });

    it("should create the tracking id", () => {
      provider = new GoogleGa({
        providerId: "UA-XXXXX-X",
      });
      expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
        "create",
        "UA-XXXXX-X",
        "auto",
      ]);
    });
  });

  describe("dispatcher", () => {
    beforeAll(() => {
      provider = new GoogleGa({ providerId: "UA-XXXXX-X", logLevel: 3 });
    });

    describe("application", () => {
      it("should set the application name", () => {
        provider.dispatch(SET_APP_NAME, "Quantum");
        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "set",
          "appName",
          "Quantum",
        ]);
      });

      it("should set the application version", () => {
        provider.dispatch(SET_APP_VERSION, "3.1.415926");
        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "set",
          "appVersion",
          "3.1.415926",
        ]);
      });

      it("should set the applicaton ID", () => {
        provider.dispatch(SET_APP_ID, "e");
        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "set",
          "appId",
          "e",
        ]);
      });
    });

    describe("pages", () => {
      it("should set the page URL", () => {
        provider.dispatch(SET_PAGE, "/von-neumann");

        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "set",
          "page",
          "/von-neumann",
        ]);
      });

      it("should record a pageview with a URL", () => {
        provider.dispatch(PAGE_VIEW, "/feynman");

        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "send",
          "pageview",
          "/feynman",
        ]);
      });

      it("should send a pageview with no URL", () => {
        provider.dispatch(PAGE_VIEW);

        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "send",
          "pageview",
        ]);
      });
    });

    describe("language", () => {
      it("should set the language", () => {
        provider.dispatch(SET_LANGUAGE, "fr");

        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "set",
          "language",
          "fr",
        ]);
      });
    });

    describe("events", () => {
      it("should send an event", () => {
        provider.dispatch(EVENT, {
          eventCategory: "Video",
          eventAction: "Play",
          eventLabel: "You must be joking Mr Feynman",
          eventValue: "299792458",
        });

        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "send",
          "event",
          {
            eventCategory: "Video",
            eventAction: "Play",
            eventLabel: "You must be joking Mr Feynman",
            eventValue: "299792458",
          },
        ]);
      });
    });

    describe("timing", () => {
      it("should send timing information", () => {
        provider.dispatch(TIMING, {
          timingCategory: "Video",
          timingVar: "Length",
          timingValue: "42",
          timingLabel: "The Feynman Lectures",
        });

        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "send",
          "timing",
          {
            timingCategory: "Video",
            timingVar: "Length",
            timingValue: "42",
            timingLabel: "The Feynman Lectures",
          },
        ]);
      });
    });

    describe("User", () => {
      it("should set a user ID", () => {
        provider.dispatch(SET_USER_ID, "name-not-a-number");

        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "set",
          "userId",
          "name-not-a-number",
        ]);
      });
    });

    describe("sessions", () => {
      it("should start a session ", () => {
        provider.dispatch(START_SESSION);

        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "send",
          "pageview",
          {
            sessionControl: "start",
          },
        ]);
      });

      it("should end a session ", () => {
        provider.dispatch(END_SESSION);

        expect(GACommandQueue()[GACommandQueue().length - 1]).toEqual([
          "send",
          "pageview",
          {
            sessionControl: "end",
          },
        ]);
      });
    });
  });
});
